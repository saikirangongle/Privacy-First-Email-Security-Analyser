// analyzers/gmail/score-engine.js
// Combines Gmail Security Check signals into a final explainable risk score

export function calculateRiskScore({
  linkAnalysis = {},
  keywordAnalysis = {},
  brandAnalysis = {}
} = {}) {
  const linkScore = linkAnalysis.score || 0;
  const keywordScore = keywordAnalysis.score || 0;
  const brandScore = brandAnalysis.score || 0;

  const totalScore = linkScore + keywordScore + brandScore;

  // -----------------------------
  // Risk Level Determination
  // -----------------------------

  let riskLevel = "Low";
  let explanation = "No strong phishing indicators were detected.";

  if (totalScore >= 10) {
    riskLevel = "High";
    explanation =
      "Multiple strong phishing indicators were detected. This email is likely unsafe.";
  } else if (totalScore >= 5) {
    riskLevel = "Medium";
    explanation =
      "Some phishing-related indicators were detected. Proceed with caution.";
  }

  // -----------------------------
  // Aggregate Checks Performed
  // -----------------------------

  const checksPerformed = [
    ...(linkAnalysis.checksPerformed || []),
    ...(keywordAnalysis.checksPerformed || []),
    ...(brandAnalysis.checksPerformed || [])
  ];

  return {
    riskLevel,
    totalScore,
    explanation,
    breakdown: {
      linkScore,
      keywordScore,
      brandScore
    },
    checksPerformed
  };
}
