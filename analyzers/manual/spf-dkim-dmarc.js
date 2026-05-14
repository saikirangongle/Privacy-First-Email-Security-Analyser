// analyzers/manual/spf-dkim-dmarc.js
// Interprets SPF, DKIM, and DMARC authentication results from headers

export function checkAuthResults(headers = {}) {
  const findings = {
    spf: "Not found",
    dkim: "Not found",
    dmarc: "Not found",
    explanations: []
  };

  if (!headers || typeof headers !== "object") {
    findings.explanations.push("No headers available for authentication analysis.");
    return findings;
  }

  const authHeader =
    headers["authentication-results"] ||
    headers["authentication-results-original"];

  if (!authHeader) {
    findings.explanations.push(
      "No Authentication-Results header found. SPF, DKIM, and DMARC cannot be verified."
    );
    return findings;
  }

  const lower = authHeader.toLowerCase();

  // -----------------------------
  // SPF
  // -----------------------------
  if (lower.includes("spf=pass")) {
    findings.spf = "Pass";
  } else if (lower.includes("spf=fail")) {
    findings.spf = "Fail";
    findings.explanations.push("SPF check failed. The sender may not be authorized.");
  }

  // -----------------------------
  // DKIM
  // -----------------------------
  if (lower.includes("dkim=pass")) {
    findings.dkim = "Pass";
  } else if (lower.includes("dkim=fail")) {
    findings.dkim = "Fail";
    findings.explanations.push("DKIM signature verification failed.");
  }

  // -----------------------------
  // DMARC
  // -----------------------------
  if (lower.includes("dmarc=pass")) {
    findings.dmarc = "Pass";
  } else if (lower.includes("dmarc=fail")) {
    findings.dmarc = "Fail";
    findings.explanations.push(
      "DMARC policy failed. The email may not align with the sender domain policy."
    );
  }

  // -----------------------------
  // Final Notes
  // -----------------------------
  if (
    findings.spf === "Pass" &&
    findings.dkim === "Pass" &&
    findings.dmarc === "Pass"
  ) {
    findings.explanations.push(
      "All email authentication checks passed."
    );
  }

  return findings;
}
