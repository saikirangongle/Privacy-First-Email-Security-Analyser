// checklist-renderer.js — renders security checks performed

export function renderChecklist(container, checks = []) {
  if (!container || !checks.length) return;

  const section = document.createElement("div");
  section.className = "result-section";

  section.innerHTML = `
    <div class="result-section-header">
      <span class="result-section-title">
        ✅ Security Checks Performed
        <span class="result-section-count clean">${checks.length}</span>
      </span>
      <span class="result-section-chevron">▾</span>
    </div>
    <div class="result-section-body">
      <div class="checklist-list">
        ${checks.map(c => `<div class="checklist-item">${c}</div>`).join("")}
      </div>
    </div>
  `;

  // Collapsible toggle
  section.querySelector(".result-section-header").addEventListener("click", () => {
    section.classList.toggle("collapsed");
  });

  // Start collapsed if more than 5 items
  if (checks.length > 5) section.classList.add("collapsed");

  container.appendChild(section);
}
