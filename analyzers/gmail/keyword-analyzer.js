// analyzers/gmail/keyword-analyzer.js
// Detects social-engineering and phishing intent from Gmail email body text

export function analyzeKeywords(bodyText = "") {
  const indicators = [];
  const checksPerformed = [];
  let score = 0;

  // -----------------------------
  // Initial validation
  // -----------------------------

  checksPerformed.push("Checked email body for social-engineering language");

  if (!bodyText || typeof bodyText !== "string") {
    return {
      indicators: [],
      checksPerformed,
      score: 0
    };
  }

  const text = bodyText.toLowerCase();

  // -----------------------------
  // Keyword Groups (Explainable)
  // -----------------------------

  const keywordGroups = [
    {
      label: "Urgency / Pressure",
      score: 2,
      keywords: [
        "urgent",
        "immediately",
        "act now",
        "as soon as possible",
        "limited time",
        "final notice"
      ]
    },
    {
      label: "Fear / Threat",
      score: 3,
      keywords: [
        "account suspended",
        "account blocked",
        "security alert",
        "unusual activity",
        "compromised",
        "unauthorized access"
      ]
    },
    {
      label: "Authority Impersonation",
      score: 2,
      keywords: [
        "it department",
        "security team",
        "administrator",
        "support team",
        "compliance team"
      ]
    },
    {
      label: "Credential / Action Request",
      score: 3,
      keywords: [
        "verify your account",
        "reset your password",
        "confirm your identity",
        "login to continue",
        "sign in immediately"
      ]
    },
    {
      label: "Financial Pressure",
      score: 3,
      keywords: [
        "payment failed",
        "invoice attached",
        "outstanding balance",
        "refund pending",
        "transaction declined"
      ]
    }
  ];

  // -----------------------------
  // Detection Logic
  // -----------------------------

  keywordGroups.forEach(group => {
    const hits = group.keywords.filter(keyword =>
      text.includes(keyword)
    );

    if (hits.length > 0) {
      indicators.push({
        category: group.label,
        matched: hits
      });
      score += group.score;
    }
  });

  if (indicators.length > 0) {
    checksPerformed.push(
      "Detected suspicious language patterns commonly used in phishing emails"
    );
  } else {
    checksPerformed.push(
      "No common social-engineering language patterns detected"
    );
  }

  return {
    indicators,
    checksPerformed,
    score
  };
}
