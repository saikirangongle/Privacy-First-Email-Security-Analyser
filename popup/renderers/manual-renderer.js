// manual-renderer.js — renders manual email forensics results

export function renderManualAnalysis(container, data = {}) {
  if (!container || !data) return;
  container.innerHTML = "";

  _renderHeaders(container, data.headers);
  _renderAuth(container, data.authentication);
  _renderTravelPath(container, data.travelPath);
}

// ── Header Analysis ──────────────────────────────────────
function _renderHeaders(container, headers) {
  const findings = headers?.findings || [];
  const section  = _makeSection("📋 Header Analysis", findings.length);
  const body     = section.querySelector(".result-section-body");

  if (!findings.length) {
    body.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📋</span><span>No headers found.</span></div>`;
  } else {
    findings.forEach(f => {
      const isClean   = f.toLowerCase().includes("no obvious");
      const div       = document.createElement("div");
      div.className   = `header-finding ${isClean ? "clean" : "flagged"}`;
      div.textContent = f;
      body.appendChild(div);
    });
  }

  container.appendChild(section);
}

// ── Authentication Results ───────────────────────────────
function _renderAuth(container, auth) {
  if (!auth) return;
  const section = _makeSection("🔐 Authentication", 0, true);
  const body    = section.querySelector(".result-section-body");

  const records = [
    { label: "SPF",   value: auth.spf   || "Not found" },
    { label: "DKIM",  value: auth.dkim  || "Not found" },
    { label: "DMARC", value: auth.dmarc || "Not found" },
  ];

  const grid = document.createElement("div");
  grid.className = "auth-grid";

  records.forEach(r => {
    const v   = r.value.toLowerCase();
    const cls = v.includes("pass") ? "pass" : v.includes("fail") ? "fail" : "unknown";
    const badge = document.createElement("div");
    badge.className = `auth-badge ${cls}`;
    badge.innerHTML = `
      <span class="auth-badge-label">${r.label}</span>
      <span class="auth-badge-value">${r.value}</span>
    `;
    grid.appendChild(badge);
  });

  body.appendChild(grid);

  if (auth.explanations?.length) {
    const expDiv = document.createElement("div");
    expDiv.style.marginTop = "8px";
    auth.explanations.forEach(e => {
      const p = document.createElement("div");
      p.className  = `header-finding ${e.toLowerCase().includes("pass") ? "clean" : "flagged"}`;
      p.style.marginBottom = "4px";
      p.textContent = e;
      expDiv.appendChild(p);
    });
    body.appendChild(expDiv);
  }

  container.appendChild(section);
}

// ── Travel Path ──────────────────────────────────────────
function _renderTravelPath(container, travelPath) {
  const hops    = travelPath?.hops || [];
  const section = _makeSection("📍 Email Travel Path", hops.length);
  const body    = section.querySelector(".result-section-body");

  if (!hops.length) {
    body.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📍</span><span>No routing headers found.</span></div>`;
  } else {
    hops.forEach((hop, i) => {
      const div = document.createElement("div");
      div.className = "hop-item";
      div.innerHTML = `
        <span class="hop-num">${i + 1}</span>
        <div class="hop-details">
          <strong>From:</strong> ${hop.from || "—"} &nbsp;·&nbsp;
          <strong>By:</strong> ${hop.by || "—"} &nbsp;·&nbsp;
          <strong>Protocol:</strong> ${hop.protocol || "—"}
          ${hop.timestamp ? `<br><span style="font-size:10px;color:#94a3b8">${hop.timestamp}</span>` : ""}
        </div>
      `;
      body.appendChild(div);
    });
  }

  container.appendChild(section);
}

// ── Helper: make a collapsible section ──────────────────
function _makeSection(title, count, noCount = false) {
  const section = document.createElement("div");
  section.className = "result-section";

  const countHtml = noCount ? "" :
    `<span class="result-section-count ${count > 0 ? "has-issues" : "clean"}">${count}</span>`;

  section.innerHTML = `
    <div class="result-section-header">
      <span class="result-section-title">
        ${title}
        ${countHtml}
      </span>
      <span class="result-section-chevron">▾</span>
    </div>
    <div class="result-section-body"></div>
  `;

  section.querySelector(".result-section-header").addEventListener("click", () => {
    section.classList.toggle("collapsed");
  });

  return section;
}
