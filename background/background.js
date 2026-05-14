// background/background.js
// MV3 Service Worker — Central coordinator
//
// VT PROGRESSIVE SCANNING — chrome.alarms based
// MV3 service workers are killed 30s after sendResponse().
// chrome.alarms wakes the worker back up for each batch.
// Pending job is stored in chrome.storage.local between batches.
// Alarm scheduling is done ONLY inside the alarm listener — never nested.

import { analyzeGmailLinks }        from "../analyzers/gmail/link-analyzer.js";
import { analyzeKeywords }           from "../analyzers/gmail/keyword-analyzer.js";
import { analyzeBrandImpersonation } from "../analyzers/gmail/brand-analyzer.js";
import { calculateRiskScore }        from "../analyzers/gmail/score-engine.js";

import { parseRawEmail }     from "../analyzers/manual/raw-email-parser.js";
import { analyzeHeaders }    from "../analyzers/manual/header-analyzer.js";
import { checkAuthResults }  from "../analyzers/manual/spf-dkim-dmarc.js";
import { analyzeTravelPath } from "../analyzers/manual/travel-map.js";

// Static imports only — dynamic import() banned in MV3 service workers
import { checkUrlsWithVirusTotal, checkIpWithAbuseIPDB } from "../services/threat-intel.js";

const VT_BATCH    = 4;
const VT_ALARM    = "vtNextBatch";
const VT_JOB_KEY  = "vtPendingJob";

// ─── Storage helpers ──────────────────────────────────────────────────────────
const store = {
  get: k  => new Promise(r => chrome.storage.local.get(k,   d => r(d[k]))),
  set: (k,v) => new Promise(r => chrome.storage.local.set({ [k]: v }, r)),
  del: k  => new Promise(r => chrome.storage.local.remove(k,     r)),
};

async function isAnalysisEnabled() { return Boolean(await store.get("analysisEnabled")); }
async function getApiKeys()        { return (await store.get("apiKeys")) || {}; }
async function getSettings() {
  const s = (await store.get("settings")) || {};
  return {
    enableLinkChecks:    s.enableLinkChecks    !== false,
    enableKeywordChecks: s.enableKeywordChecks !== false,
    enableBrandChecks:   s.enableBrandChecks   !== false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function notify(payload) {
  chrome.runtime.sendMessage({ action: "VT_PROGRESS", ...payload })
    .catch(() => {});
}

function markAnalysing(urls) {
  urls.forEach(url => notify({ url, result: { analysing: true } }));
}

// ── scheduleNextAlarm — MUST be async and awaited in the alarm listener ──────
// Using callback-based chrome.alarms.clear + create without awaiting caused
// the service worker to sleep before the create() ran — batches 4+ never fired.
async function scheduleNextAlarm() {
  // clear() returns a Promise in Chrome 111+ MV3
  await chrome.alarms.clear(VT_ALARM);
  // Use { when } with exact ms instead of delayInMinutes for precision
  // 61 000 ms = 61 seconds — avoids VT free-tier queuing at exactly 60s
  chrome.alarms.create(VT_ALARM, { when: Date.now() + 61000 });
}

function extractLinksFromText(text = "") {
  const raw = text.match(/\bhttps?:\/\/[^\s<>"')\]]+/gi) || [];
  return [...new Set(raw)].filter(url => {
    try {
      const h = new URL(url).hostname;
      return h.includes(".") && h.length >= 4 &&
             !/[=+@%]/.test(h) && /^[a-z0-9.\-]+$/i.test(h) &&
             h.split(".").pop().length >= 2;
    } catch { return false; }
  });
}

// ════════════════════════════════════════════════════════════════════
// ALARM LISTENER
// All alarm scheduling lives here — never inside helper functions.
// ════════════════════════════════════════════════════════════════════
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== VT_ALARM) return;

  // Load pending job
  const job = await store.get(VT_JOB_KEY);
  if (!job?.pendingUrls?.length) {
    await store.del(VT_JOB_KEY);
    return;
  }

  const {
    pendingUrls, completedResults, baseScore,
    batchNum, totalBatches, vtKey
  } = job;

  // Slice this batch
  const batch     = pendingUrls.slice(0, VT_BATCH);
  const remaining = pendingUrls.slice(VT_BATCH);

  // Show "Analysing..." for this batch in popup
  markAnalysing(batch);

  // Scan the batch
  let vtResults = {};
  try {
    vtResults = await checkUrlsWithVirusTotal(batch, vtKey);
  } catch {
    batch.forEach(url => { vtResults[url] = { error: "VT lookup failed" }; });
  }

  // Merge into completed map
  const allCompleted = { ...completedResults };
  batch.forEach(url => { allCompleted[url] = vtResults[url] ?? null; });

  // Recalculate score
  const vtBonus = Object.values(allCompleted)
    .reduce((sum, r) => sum + ((r?.malicious ?? 0) > 0 ? 3 : 0), 0);
  const updatedTotal = baseScore + vtBonus;
  const updatedLevel = updatedTotal >= 10 ? "High"
                     : updatedTotal >= 5  ? "Medium" : "Low";

  // Push batch results to popup
  notify({
    batchComplete: true,
    batchNum,
    totalBatches,
    updatedLinks:  batch.map(url => ({ url, virusTotal: vtResults[url] ?? null })),
    updatedScore:  updatedTotal,
    updatedLevel,
  });

  if (remaining.length > 0) {
    // Persist updated job THEN schedule next alarm
    await store.set(VT_JOB_KEY, {
      pendingUrls:      remaining,
      completedResults: allCompleted,
      baseScore,
      batchNum:         batchNum + 1,
      totalBatches,
      vtKey,
    });
    await scheduleNextAlarm();   // awaited — keeps service worker alive until alarm is registered
  } else {
    // All batches done
    await store.del(VT_JOB_KEY);
  }
});

// ════════════════════════════════════════════════════════════════════
// START PROGRESSIVE VT — called once after initial sendResponse()
// Scans batch 1 immediately, stores remaining, schedules alarm.
// ════════════════════════════════════════════════════════════════════
async function startProgressiveVT(allLinks, vtKey, baseScore) {
  if (!vtKey || !allLinks.length) return;

  // Cancel any leftover job from a previous run
  await chrome.alarms.clear(VT_ALARM);
  await store.del(VT_JOB_KEY);

  const allUrls      = allLinks.map(l => l.url);
  const batch1       = allUrls.slice(0, VT_BATCH);
  const remaining    = allUrls.slice(VT_BATCH);
  const totalBatches = Math.ceil(allUrls.length / VT_BATCH);

  // Mark batch 1 as analysing
  markAnalysing(batch1);
  // Mark all future batches as queued (shows "Analysing..." immediately)
  remaining.forEach(url => notify({ url, result: { analysing: true } }));

  // Scan batch 1 now
  let vtResults = {};
  try {
    vtResults = await checkUrlsWithVirusTotal(batch1, vtKey);
  } catch {
    batch1.forEach(url => { vtResults[url] = { error: "VT lookup failed" }; });
  }

  // Write results back to link objects
  batch1.forEach(url => {
    const link = allLinks.find(l => l.url === url);
    if (link) link.virusTotal = vtResults[url] ?? null;
  });

  // Score after batch 1
  const vtBonus = batch1.reduce(
    (sum, url) => sum + ((vtResults[url]?.malicious ?? 0) > 0 ? 3 : 0), 0
  );
  const updatedTotal = baseScore + vtBonus;
  const updatedLevel = updatedTotal >= 10 ? "High"
                     : updatedTotal >= 5  ? "Medium" : "Low";

  notify({
    batchComplete: true,
    batchNum:      1,
    totalBatches,
    updatedLinks:  batch1.map(url => ({ url, virusTotal: vtResults[url] ?? null })),
    updatedScore:  updatedTotal,
    updatedLevel,
  });

  if (remaining.length > 0) {
    // Store job for alarm handler
    await store.set(VT_JOB_KEY, {
      pendingUrls:      remaining,
      completedResults: vtResults,
      baseScore,
      batchNum:         2,
      totalBatches,
      vtKey,
    });
    await scheduleNextAlarm();
  }
}

// ─── AbuseIPDB ────────────────────────────────────────────────────────────────
async function runAbuseIPDB(links, abuseKey) {
  if (!abuseKey) return;
  for (const link of links) {
    if (link.hostname && /^\d{1,3}(\.\d{1,3}){3}$/.test(link.hostname)) {
      try { link.abuseIPDB = await checkIpWithAbuseIPDB(link.hostname, abuseKey); }
      catch { link.abuseIPDB = { error: "AbuseIPDB lookup failed" }; }
    }
  }
}

// ════════════════════════════════════════════════════════════════════
// MESSAGE LISTENER
// ════════════════════════════════════════════════════════════════════
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action !== "RUN_ANALYSIS") return;
  handleAnalysis(message, sendResponse);
  return true;
});

async function handleAnalysis(message, sendResponse) {
  try {
    if (!(await isAnalysisEnabled())) {
      sendResponse({ error: "Analysis is disabled. Enable it using the toggle." });
      return;
    }
    if (message.mode === "gmail")       await runGmailSecurityCheck(sendResponse);
    else if (message.mode === "manual") {
      if (!message.payload) { sendResponse({ error: "No raw email content provided." }); return; }
      await runManualAnalysis(message.payload, sendResponse);
    } else {
      sendResponse({ error: "Invalid analysis mode." });
    }
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════════
// GMAIL SECURITY CHECK
// ════════════════════════════════════════════════════════════════════
async function runGmailSecurityCheck(sendResponse) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://mail.google.com/")) {
    sendResponse({ error: "Gmail Security Check works only on an opened Gmail email." });
    return;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["content/gmail-content.js"]
  });

  const emailData = results.map(r => r.result)
    .find(r => r?.body && Array.isArray(r.links));

  if (!emailData) {
    sendResponse({ error: "Unable to extract email body. Please open an email first." });
    return;
  }

  const settings = await getSettings();

  const linkAnalysis = settings.enableLinkChecks
    ? analyzeGmailLinks(emailData)
    : { links: [], checksPerformed: ["Link analysis disabled in settings"], score: 0 };

  const keywordAnalysis = settings.enableKeywordChecks
    ? analyzeKeywords(emailData.body)
    : { indicators: [], checksPerformed: ["Keyword detection disabled in settings"], score: 0 };

  const brandAnalysis = settings.enableBrandChecks
    ? analyzeBrandImpersonation(emailData.body, emailData.links)
    : { findings: [], checksPerformed: ["Brand impersonation detection disabled in settings"], score: 0 };

  const { virustotal: vtKey, abuseipdb: abuseKey } = await getApiKeys();
  const base         = calculateRiskScore({ linkAnalysis, keywordAnalysis, brandAnalysis });
  const totalBatches = vtKey ? Math.ceil(linkAnalysis.links.length / VT_BATCH) : 0;

  if (vtKey && linkAnalysis.links.length) {
    linkAnalysis.checksPerformed.push(
      `VirusTotal: ${linkAnalysis.links.length} link(s) scanning in batches of ${VT_BATCH} ` +
      `(~1 min between batches)`
    );
  } else {
    linkAnalysis.checksPerformed.push("VirusTotal skipped — API key not configured");
  }

  sendResponse({
    mode:              "gmail-security-check",
    riskLevel:         base.riskLevel,
    score:             base.totalScore,
    explanation:       base.explanation,
    breakdown:         base.breakdown,
    checksPerformed:   base.checksPerformed,
    links:             linkAnalysis.links,
    keywordIndicators: keywordAnalysis.indicators,
    brandFindings:     brandAnalysis.findings,
    vtScanning:        vtKey && linkAnalysis.links.length > 0,
    totalBatches,
  });

  if (abuseKey) await runAbuseIPDB(linkAnalysis.links, abuseKey);
  if (vtKey)    await startProgressiveVT(linkAnalysis.links, vtKey, base.totalScore);
}

// ════════════════════════════════════════════════════════════════════
// MANUAL EMAIL ANALYSIS
// ════════════════════════════════════════════════════════════════════
async function runManualAnalysis(rawEmail, sendResponse) {
  const parsed    = parseRawEmail(rawEmail);
  const settings  = await getSettings();
  const body      = parsed.body || "";
  const extracted = extractLinksFromText(body);

  const linkAnalysis = settings.enableLinkChecks
    ? analyzeGmailLinks({ body, links: extracted })
    : { links: [], checksPerformed: ["Link analysis disabled in settings"], score: 0 };

  const keywordAnalysis = settings.enableKeywordChecks
    ? analyzeKeywords(body)
    : { indicators: [], checksPerformed: ["Keyword detection disabled in settings"], score: 0 };

  const brandAnalysis = settings.enableBrandChecks
    ? analyzeBrandImpersonation(body, extracted)
    : { findings: [], checksPerformed: ["Brand impersonation detection disabled in settings"], score: 0 };

  const { virustotal: vtKey, abuseipdb: abuseKey } = await getApiKeys();
  const base         = calculateRiskScore({ linkAnalysis, keywordAnalysis, brandAnalysis });
  const totalBatches = vtKey ? Math.ceil(linkAnalysis.links.length / VT_BATCH) : 0;

  if (vtKey && linkAnalysis.links.length) {
    linkAnalysis.checksPerformed.push(
      `VirusTotal: ${linkAnalysis.links.length} link(s) scanning in batches of ${VT_BATCH} ` +
      `(~1 min between batches)`
    );
  } else {
    linkAnalysis.checksPerformed.push("VirusTotal skipped — API key not configured");
  }

  sendResponse({
    mode:              "manual-analysis",
    riskLevel:         base.riskLevel,
    score:             base.totalScore,
    explanation:       base.explanation,
    breakdown:         base.breakdown,
    checksPerformed:   base.checksPerformed,
    headers:           analyzeHeaders(parsed.headers),
    authentication:    checkAuthResults(parsed.headers),
    travelPath:        analyzeTravelPath(parsed.headers),
    links:             linkAnalysis.links,
    keywordIndicators: keywordAnalysis.indicators,
    brandFindings:     brandAnalysis.findings,
    vtScanning:        vtKey && linkAnalysis.links.length > 0,
    totalBatches,
  });

  if (abuseKey) await runAbuseIPDB(linkAnalysis.links, abuseKey);
  if (vtKey)    await startProgressiveVT(linkAnalysis.links, vtKey, base.totalScore);
}
