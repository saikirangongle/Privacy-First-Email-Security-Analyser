// analyzers/gmail/link-analyzer.js
// Link-based security analysis for Gmail Security Check (body-level only)

import {
  isValidUrl,
  isIpAddress,
  getFileExtensionFromUrl
} from "../../utils/validators.js";

// Known URL shorteners
const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "shorturl.at"
];

// Suspicious TLDs (lightweight heuristic)
const SUSPICIOUS_TLDS = ["zip", "xyz", "tk", "top", "gq", "cf"];

export function analyzeGmailLinks(emailData = {}) {
  const { body = "", links = [] } = emailData;

  const analyzedLinks = [];
  const checksPerformed = [];
  let score = 0;

  // -----------------------------
  // Initial checks
  // -----------------------------

  checksPerformed.push("Email body extracted");
  checksPerformed.push("Checked for links in the email body");

  if (!Array.isArray(links) || links.length === 0) {
    return {
      links: [],
      checksPerformed,
      score
    };
  }

  checksPerformed.push("Extracted links from email body");
  checksPerformed.push("Checked for non-HTTPS links");
  checksPerformed.push("Checked for IP-based URLs");
  checksPerformed.push("Checked for URL shorteners");
  checksPerformed.push("Checked for suspicious file downloads");
  checksPerformed.push("Checked for suspicious top-level domains");

  // -----------------------------
  // Per-link analysis
  // -----------------------------

  links.forEach(rawUrl => {
    if (!isValidUrl(rawUrl)) return;

    const urlObj = new URL(rawUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const issues = [];

    // Non-HTTPS
    if (urlObj.protocol !== "https:") {
      issues.push("Uses an unencrypted HTTP connection");
      score += 2;
    }

    // IP-based URL
    if (isIpAddress(hostname)) {
      issues.push("Uses an IP address instead of a domain name");
      score += 5;
    }

    // URL shortener
    if (SHORTENERS.some(s => hostname.endsWith(s))) {
      issues.push("Uses a URL shortening service");
      score += 3;
    }

    // Suspicious TLD
    const tld = hostname.split(".").pop();
    if (SUSPICIOUS_TLDS.includes(tld)) {
      issues.push("Uses a suspicious top-level domain");
      score += 3;
    }

    // File extension (ANY extension)
    const fileExtension = getFileExtensionFromUrl(rawUrl);
    if (fileExtension) {
      issues.push(`Links to a downloadable file (.${fileExtension})`);
      score += 2;
    }

    analyzedLinks.push({
      url: rawUrl,
      hostname,
      fileExtension: fileExtension || null,
      issues,
      virusTotal: null // filled later in background.js
    });
  });

  return {
    links: analyzedLinks,
    checksPerformed,
    score
  };
}
