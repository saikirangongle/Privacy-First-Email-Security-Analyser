// background/background.js
// MV3 Service Worker
// Central coordinator for Gmail Security Check & Manual Email Analysis

import { analyzeGmailLinks } from "../analyzers/gmail/link-analyzer.js";
import { analyzeKeywords } from "../analyzers/gmail/keyword-analyzer.js";
import { analyzeBrandImpersonation } from "../analyzers/gmail/brand-analyzer.js";
import { calculateRiskScore } from "../analyzers/gmail/score-engine.js";

import { parseRawEmail } from "../analyzers/manual/raw-email-parser.js";
import { analyzeHeaders } from "../analyzers/manual/header-analyzer.js";
import { checkAuthResults } from "../analyzers/manual/spf-dkim-dmarc.js";
import { analyzeTravelPath } from "../analyzers/manual/travel-map.js";

import { checkUrlWithVirusTotal } from "../services/threat-intel.js";

// ===============================
// Link Extract Helpers
// ===============================

function extractLinksFromText(text = "") {
  const urlRegex =
    /\bhttps?:\/\/[^\s<>"']+/gi;

  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

// ===============================
// Storage Helpers
// ===============================

function getFromStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

async function isAnalysisEnabled() {
  return Boolean(await getFromStorage("analysisEnabled"));
}

async function getApiKeys() {
  return (await getFromStorage("apiKeys")) || {};
}

// ===============================
// Message Listener
// ===============================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action !== "RUN_ANALYSIS") return;

  handleAnalysis(message)
    .then(result => sendResponse(result))
    .catch(err => sendResponse({ error: err.message }));

  return true;
});

// ===============================
// Main Dispatcher
// ===============================

async function handleAnalysis(message) {
  if (!(await isAnalysisEnabled())) {
    throw new Error("Analysis is disabled.");
  }

  if (message.mode === "gmail") {
    return runGmailSecurityCheck();
  }

  if (message.mode === "manual") {
    if (!message.payload) {
      throw new Error("No raw email content provided.");
    }
    return runManualAnalysis(message.payload);
  }

  throw new Error("Invalid analysis mode.");
}

// ===============================
// Gmail Security Check (UNCHANGED)
// ===============================

async function runGmailSecurityCheck() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id || !tab.url?.startsWith("https://mail.google.com/")) {
    throw new Error("Gmail Security Check works only on opened Gmail emails.");
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ["content/gmail-content.js"]
  });

  const emailData = results
    .map(r => r.result)
    .find(r => r && r.body && Array.isArray(r.links));

  if (!emailData) {
    throw new Error("Unable to extract email body from Gmail.");
  }

  const linkAnalysis = analyzeGmailLinks(emailData);
  const keywordAnalysis = analyzeKeywords(emailData.body);
  const brandAnalysis = analyzeBrandImpersonation(
    emailData.body,
    emailData.links
  );

  const apiKeys = await getApiKeys();
  const vtKey = apiKeys.virustotal || null;

  if (vtKey && Array.isArray(linkAnalysis.links)) {
    for (const link of linkAnalysis.links) {
      const vtResult = await checkUrlWithVirusTotal(link.url, vtKey);
      link.virusTotal = vtResult;
    }

    linkAnalysis.checksPerformed.push(
      `VirusTotal URL reputation check performed on ${linkAnalysis.links.length} link(s)`
    );
  } else {
    linkAnalysis.checksPerformed.push(
      "VirusTotal URL reputation check skipped (API key not configured)"
    );
  }

  const finalScore = calculateRiskScore({
    linkAnalysis,
    keywordAnalysis,
    brandAnalysis
  });

  return {
    mode: "gmail-security-check",
    riskLevel: finalScore.riskLevel,
    score: finalScore.totalScore,
    explanation: finalScore.explanation,
    breakdown: finalScore.breakdown,
    checksPerformed: finalScore.checksPerformed,
    links: linkAnalysis.links,
    keywordIndicators: keywordAnalysis.indicators,
    brandFindings: brandAnalysis.findings
  };
}

// ===============================
// Manual Email Analysis (FIXED)
// ===============================

async function runManualAnalysis(rawEmail) {
  const parsed = parseRawEmail(rawEmail);

  // ✅ STEP 1: Extract links from RAW BODY
  const extractedLinks = extractLinksFromText(parsed.body || "");

  // ✅ STEP 2: Analyze extracted links
  const linkAnalysis = analyzeGmailLinks({
    body: parsed.body || "",
    links: extractedLinks
  });

  // ✅ STEP 3: VirusTotal (background only)
  const apiKeys = await getApiKeys();
  const vtKey = apiKeys.virustotal || null;

  if (vtKey && Array.isArray(linkAnalysis.links)) {
    for (const link of linkAnalysis.links) {
      try {
        const vtResult = await checkUrlWithVirusTotal(link.url, vtKey);
        link.virusTotal = vtResult;
      } catch {
        link.virusTotal = { error: true };
      }
    }
  }

  // ✅ STEP 4: Return structured data ONLY
  return {
    headers: analyzeHeaders(parsed.headers),
    authentication: checkAuthResults(parsed.headers),
    travelPath: analyzeTravelPath(parsed.headers),
    links: linkAnalysis.links
  };
}

