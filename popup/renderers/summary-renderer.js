// summary-renderer.js — renders risk summary card

export function renderSummary(container, summary = {}) {
  if (!container) return;
  container.innerHTML = "";

  const { riskLevel = "Unknown", totalScore = null, explanation = "" } = summary;
  const level = riskLevel.toLowerCase();
  const cls   = ["low","medium","high"].includes(level) ? level : "unknown";

  const labels = { low: "Low Risk", medium: "Medium Risk", high: "High Risk", unknown: riskLevel };

  const card = document.createElement("div");
  card.className = "risk-summary";

  card.innerHTML = `
    <div class="risk-header ${cls}">
      <div class="risk-level-badge">
        <span class="risk-dot"></span>
        <span>${labels[cls] || riskLevel}</span>
      </div>
      ${typeof totalScore === "number"
        ? `<span class="risk-score-pill">Score: ${totalScore}</span>`
        : ""}
    </div>
    ${explanation
      ? `<div class="risk-explanation">${explanation}</div>`
      : ""}
  `;

  container.appendChild(card);
}
