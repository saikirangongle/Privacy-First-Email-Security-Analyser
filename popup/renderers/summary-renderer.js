// popup/renderers/summary-renderer.js
// Renders the overall risk summary in the popup

export function renderSummary(container, summary = {}) {
  if (!container) return;

  container.innerHTML = "";

  const {
    riskLevel = "Unknown",
    totalScore = null,
    explanation = ""
  } = summary;

  const wrapper = document.createElement("div");
  wrapper.className = "summary-block";

  const level = document.createElement("div");
  level.innerHTML = `<strong>Risk Level:</strong> ${riskLevel}`;
  wrapper.appendChild(level);

  if (typeof totalScore === "number") {
    const score = document.createElement("div");
    score.innerHTML = `<strong>Score:</strong> ${totalScore}`;
    wrapper.appendChild(score);
  }

  if (explanation) {
    const exp = document.createElement("p");
    exp.textContent = explanation;
    wrapper.appendChild(exp);
  }

  container.appendChild(wrapper);
}
