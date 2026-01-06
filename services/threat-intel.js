// services/threat-intel.js
// Threat-intelligence lookups (VirusTotal, AbuseIPDB)
// IMPORTANT: This file MUST be used ONLY from background service worker

const VT_API_BASE = "https://www.virustotal.com/api/v3";
const ABUSE_API_BASE = "https://api.abuseipdb.com/api/v2";

// ===============================
// Helpers
// ===============================

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isIpAddress(value) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

// ===============================
// VirusTotal URL Reputation
// ===============================

export async function checkUrlWithVirusTotal(url, apiKey) {
  // Guard checks (NO browser calls)
  if (!apiKey || !isValidUrl(url)) {
    return null;
  }

  // VirusTotal requires base64-url encoding (no padding)
  const encodedUrl = btoa(url)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const response = await fetch(
      `${VT_API_BASE}/urls/${encodedUrl}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error("VirusTotal request failed");
    }

    const data = await response.json();
    const stats = data?.data?.attributes?.last_analysis_stats;

    if (!stats) return null;

    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0
    };
  } catch (err) {
    // IMPORTANT: Never crash the background worker
    return { error: "VirusTotal lookup failed" };
  }
}

// ===============================
// AbuseIPDB IP Reputation
// ===============================

export async function checkIpWithAbuseIPDB(ip, apiKey) {
  if (!apiKey || !isIpAddress(ip)) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: "90"
    });

    const response = await fetch(
      `${ABUSE_API_BASE}/check?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Key: apiKey,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("AbuseIPDB request failed");
    }

    const data = await response.json();
    const report = data?.data;

    if (!report) return null;

    return {
      abuseConfidenceScore: report.abuseConfidenceScore,
      totalReports: report.totalReports,
      countryCode: report.countryCode,
      isp: report.isp
    };
  } catch {
    return { error: "AbuseIPDB lookup failed" };
  }
}
