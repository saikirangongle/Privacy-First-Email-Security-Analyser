// body-renderer.js — renders keyword and brand findings

export function renderBodyFindings(container, data = {}) {
  if (!container) return;
  container.innerHTML = "";

  const keywords = Array.isArray(data.keywordIndicators) ? data.keywordIndicators : [];
  const brands   = Array.isArray(data.brandFindings)     ? data.brandFindings     : [];
  const total    = keywords.length + brands.length;

  const section = document.createElement("div");
  section.className = "result-section";

  const countClass = total > 0 ? "has-issues" : "clean";

  section.innerHTML = `
    <div class="result-section-header">
      <span class="result-section-title">
        💬 Body Analysis
        <span class="result-section-count ${countClass}">${total} finding${total !== 1 ? "s" : ""}</span>
      </span>
      <span class="result-section-chevron">▾</span>
    </div>
    <div class="result-section-body"></div>
  `;

  const body = section.querySelector(".result-section-body");

  if (total === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">✅</span>
        <span>No suspicious patterns found in email body.</span>
      </div>`;
  } else {
    if (keywords.length > 0) {
      const g = document.createElement("div");
      g.className = "finding-group";
      g.innerHTML = `<div class="finding-group-title">⚠ Social Engineering Language</div>
        <div class="finding-keyword-pills">
          ${keywords.map(ind =>
            ind.matched.map(m =>
              `<span class="keyword-pill" title="${ind.category}">${m}</span>`
            ).join("")
          ).join("")}
        </div>`;
      body.appendChild(g);
    }

    if (brands.length > 0) {
      const g = document.createElement("div");
      g.className = "finding-group";
      g.innerHTML = `<div class="finding-group-title">🏷️ Brand Impersonation</div>
        ${brands.map(b =>
          `<div class="brand-finding"><strong>${b.brand}</strong> — ${b.issue}</div>`
        ).join("")}`;
      body.appendChild(g);
    }
  }

  section.querySelector(".result-section-header").addEventListener("click", () => {
    section.classList.toggle("collapsed");
  });

  container.appendChild(section);
}
