// analyzers/manual/header-analyzer.js
// Analyzes raw email headers for anomalies and inconsistencies

export function analyzeHeaders(headers = {}) {
  const findings = [];

  if (!headers || typeof headers !== "object") {
    return {
      findings: ["No headers available for analysis."]
    };
  }

  // -----------------------------
  // Helper
  // -----------------------------
  const has = key => Object.prototype.hasOwnProperty.call(headers, key);

  // -----------------------------
  // Basic Presence Checks
  // -----------------------------

  if (!has("from")) {
    findings.push("Missing 'From' header.");
  }

  if (!has("to")) {
    findings.push("Missing 'To' header.");
  }

  if (!has("date")) {
    findings.push("Missing 'Date' header.");
  }

  if (!has("message-id")) {
    findings.push("Missing 'Message-ID' header (unusual for legitimate emails).");
  }

  // -----------------------------
  // Reply-To Mismatch
  // -----------------------------

  if (has("from") && has("reply-to")) {
    if (headers["from"] !== headers["reply-to"]) {
      findings.push(
        "The 'Reply-To' address differs from the 'From' address. This can be used in phishing."
      );
    }
  }

  // -----------------------------
  // Multiple Received Headers
  // -----------------------------

  const receivedHeaders = Object.keys(headers).filter(
    key => key === "received"
  );

  if (receivedHeaders.length === 0) {
    findings.push("No 'Received' headers found. Email routing cannot be verified.");
  }

  // -----------------------------
  // Suspicious Header Fields
  // -----------------------------

  if (has("x-mailer")) {
    findings.push(
      "The email contains an 'X-Mailer' header, which may reveal the sending software."
    );
  }

  if (has("x-priority")) {
    findings.push(
      "The email sets a priority flag. Phishing emails often mark messages as urgent."
    );
  }

  // -----------------------------
  // Final Output
  // -----------------------------

  if (findings.length === 0) {
    findings.push("No obvious header anomalies detected.");
  }

  return {
    findings
  };
}
