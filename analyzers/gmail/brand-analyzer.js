// analyzers/gmail/brand-analyzer.js
// Detects brand impersonation using email body text and link domains (Gmail Security Check)

export function analyzeBrandImpersonation(bodyText = "", links = []) {
  const findings = [];
  const checksPerformed = [];
  let score = 0;

  // -----------------------------
  // Initial checks
  // -----------------------------

  checksPerformed.push("Checked email body for brand impersonation");

  if (!bodyText || !Array.isArray(links) || links.length === 0) {
    checksPerformed.push(
      "Brand impersonation check skipped (missing body text or links)"
    );
    return {
      findings: [],
      checksPerformed,
      score: 0
    };
  }

  const text = bodyText.toLowerCase();

  // -----------------------------
  // Known Brands (Extendable)
  // -----------------------------
  // These represent commonly impersonated brands in phishing emails
  const brands = [
    "google",
    "gmail",
    "microsoft",
    "outlook",
    "paypal",
    "amazon",
    "apple",
    "facebook",
    "instagram",
    "linkedin",
    "netflix",
    "bank",
    "upi"
  ];

  // -----------------------------
  // Extract link domains
  // -----------------------------

  const domains = links
    .map(link => {
      try {
        return new URL(link).hostname.toLowerCase();
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // -----------------------------
  // Detection Logic
  // -----------------------------

  brands.forEach(brand => {
    if (!text.includes(brand)) return;

    const matchingDomain = domains.find(domain =>
      domain.includes(brand)
    );

    if (!matchingDomain) {
      findings.push({
        brand,
        issue:
          "Brand name mentioned in the email body, but link domains do not match the brand"
      });
      score += 4;
    }
  });

  if (findings.length > 0) {
    checksPerformed.push(
      "Detected possible brand impersonation based on body and link domain mismatch"
    );
  } else {
    checksPerformed.push(
      "No brand impersonation patterns detected"
    );
  }

  return {
    findings,
    checksPerformed,
    score
  };
}
