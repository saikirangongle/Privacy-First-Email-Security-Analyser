// popup/renderers/body-renderer.js
// Renders body-level phishing indicators (keywords, brand impersonation)

export function renderBodyFindings(container, data = {}) {
  if (!container) return;

  container.innerHTML = "";

  const sections = [];

  // -----------------------------
  // Keyword / Intent Indicators
  // -----------------------------
  if (Array.isArray(data.keywordIndicators) && data.keywordIndicators.length > 0) {
    sections.push({
      title: "Suspicious Language Detected",
      items: data.keywordIndicators.map(ind => {
        return `${ind.category}: ${ind.matched.join(", ")}`;
      })
    });
  }

  // -----------------------------
  // Brand Impersonation Findings
  // -----------------------------
  if (Array.isArray(data.brandFindings) && data.brandFindings.length > 0) {
    sections.push({
      title: "Possible Brand Impersonation",
      items: data.brandFindings.map(b =>
        `Brand mentioned: ${b.brand} — ${b.issue}`
      )
    });
  }

  if (sections.length === 0) {
    container.textContent =
      "No suspicious patterns detected in the email content.";
    return;
  }

  // -----------------------------
  // Render Sections
  // -----------------------------
  sections.forEach(section => {
    const heading = document.createElement("h4");
    heading.textContent = section.title;
    container.appendChild(heading);

    const list = document.createElement("ul");
    section.items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });

    container.appendChild(list);
  });
}
