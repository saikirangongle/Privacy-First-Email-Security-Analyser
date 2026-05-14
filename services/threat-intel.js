// services/threat-intel.js
// Threat-intelligence lookups (VirusTotal, AbuseIPDB)
// IMPORTANT: Use ONLY from background service worker

const VT_API_BASE    = "https://www.virustotal.com/api/v3";
const ABUSE_API_BASE = "https://api.abuseipdb.com/api/v2";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

function isIpAddress(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── URL guard — rejects malformed hostnames VT cannot canonicalize ──────────
// Catches Base64 fragments, encoding artifacts (https://l=, https://links.myo=)
function isSubmittableUrl(url) {
  try {
    const h = new URL(url).hostname;
    if (!h.includes("."))          return false;  // no dot
    if (h.length < 4)              return false;  // too short
    if (/[=+@%]/.test(h))          return false;  // Base64 / encoding chars
    if (!/^[a-z0-9.\-]+$/i.test(h)) return false; // invalid chars
    if (h.split(".").pop().length < 2) return false; // TLD too short
    return true;
  } catch { return false; }
}

// ─── Rate-limited fetch — retries once on 429 with back-off ─────────────────
async function vtFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 429) {
    // VT free tier: 4 req/min — wait 16s and retry once
    await sleep(16000);
    return fetch(url, options);
  }
  return res;
}

// ─── Phase 1: cache-check a single URL (one GET, very fast) ─────────────────
async function checkCache(url, apiKey) {
  const urlId = btoa(url)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await vtFetch(`${VT_API_BASE}/urls/${urlId}`, {
    method: "GET",
    headers: { "x-apikey": apiKey }
  });

  if (!res.ok) return null;                                  // cache miss
  const data  = await res.json();
  const stats = data?.data?.attributes?.last_analysis_stats;
  return stats ? _formatStats(stats) : null;                 // cache hit
}

// ─── Phase 2: submit + poll for a single URL ─────────────────────────────────
async function submitAndPoll(url, apiKey) {
  // Submit
  const submitRes = await vtFetch(`${VT_API_BASE}/urls`, {
    method: "POST",
    headers: {
      "x-apikey": apiKey,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ url }).toString()
  });

  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    return { error: err?.error?.message || `VT submit HTTP ${submitRes.status}` };
  }

  const analysisId = (await submitRes.json())?.data?.id;
  if (!analysisId) return { error: "VT returned no analysis ID" };

  // Poll up to 3× with 2.5s between each — total max 7.5s
  for (let i = 0; i < 3; i++) {
    await sleep(2500);
    const pollRes = await vtFetch(`${VT_API_BASE}/analyses/${analysisId}`, {
      method: "GET",
      headers: { "x-apikey": apiKey }
    });
    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const status   = pollData?.data?.attributes?.status;
    const stats    = pollData?.data?.attributes?.stats;
    if (status === "completed" && stats) return _formatStats(stats);
  }

  return { queued: true };  // analysis exists but VT hasn't finished yet
}

// ─── Public: check multiple URLs — smart two-phase approach ─────────────────
//
// Phase 1 (parallel): cache-check ALL valid URLs at once.
//   → instantly returns results for URLs VT already knows.
//   → only 1 request per URL, so even 10 parallel GETs is fine.
//
// Phase 2 (sequential): for cache misses, submit + poll one at a time.
//   → avoids rate-limit (4 req/min) by spacing submissions 1s apart.
//   → typical phishing email has 1–3 novel URLs so this stays fast.
//
// Hard per-URL timeout: 10s.

export async function checkUrlsWithVirusTotal(urls, apiKey) {
  if (!apiKey || !urls.length) return {};

  const validUrls = urls.filter(isSubmittableUrl);
  const results   = {};   // url → result object

  // ── Phase 1: parallel cache-checks ─────────────────────────────────────
  await Promise.allSettled(
    validUrls.map(async url => {
      results[url] = await checkCache(url, apiKey);
    })
  );

  // ── Phase 2: sequential submit+poll for cache misses ───────────────────
  const misses = validUrls.filter(url => results[url] === null);

  for (const url of misses) {
    const timeoutP = new Promise(resolve =>
      setTimeout(() => resolve({ error: "VT timeout (10s)" }), 10000)
    );
    results[url] = await Promise.race([timeoutP, submitAndPoll(url, apiKey)]);

    // 1s breathing room between submissions to stay under rate limit
    if (misses.indexOf(url) < misses.length - 1) await sleep(1000);
  }

  // Mark skipped URLs (malformed hostnames)
  for (const url of urls) {
    if (!isSubmittableUrl(url)) {
      results[url] = { skipped: true };
    }
  }

  return results;
}

// Keep single-URL export for backward compat
export async function checkUrlWithVirusTotal(url, apiKey) {
  const r = await checkUrlsWithVirusTotal([url], apiKey);
  return r[url] ?? null;
}

function _formatStats(stats) {
  return {
    malicious:  stats.malicious  || 0,
    suspicious: stats.suspicious || 0,
    harmless:   stats.harmless   || 0,
    undetected: stats.undetected || 0
  };
}

// ─── AbuseIPDB ───────────────────────────────────────────────────────────────
export async function checkIpWithAbuseIPDB(ip, apiKey) {
  if (!apiKey || !isIpAddress(ip)) return null;

  try {
    const params = new URLSearchParams({ ipAddress: ip, maxAgeInDays: "90" });
    const res = await fetch(`${ABUSE_API_BASE}/check?${params}`, {
      method: "GET",
      headers: { Key: apiKey, Accept: "application/json" }
    });
    if (!res.ok) return { error: `AbuseIPDB HTTP ${res.status}` };

    const report = (await res.json())?.data;
    if (!report) return null;

    return {
      abuseConfidenceScore: report.abuseConfidenceScore,
      totalReports:         report.totalReports,
      countryCode:          report.countryCode,
      isp:                  report.isp
    };
  } catch (err) {
    return { error: err.message };
  }
}
