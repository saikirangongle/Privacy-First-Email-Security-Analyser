// popup/renderers/link-renderer.js
// Renders link cards. updateLinkVT() and updateScore() handle live VT updates.

export function renderLinks(container, links = []) {
  if (!container) return;
  container.innerHTML = "";

  const hasIssues = links.some(l => l.issues?.length > 0);
  const count     = links.length;
  const section   = document.createElement("div");
  section.className = "result-section";

  section.innerHTML = `
    <div class="result-section-header">
      <span class="result-section-title">
        🔗 Links Found
        <span class="result-section-count ${count === 0 ? "clean" : hasIssues ? "has-issues" : "clean"}">${count}</span>
      </span>
      <span class="result-section-chevron">▾</span>
    </div>
    <div class="result-section-body"></div>
  `;

  const body = section.querySelector(".result-section-body");

  if (count === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🔗</span>
        <span>No links found in the email.</span>
      </div>`;
  } else {
    links.forEach((link, i) => body.appendChild(_buildCard(link, i)));
  }

  section.querySelector(".result-section-header").addEventListener("click", () => {
    section.classList.toggle("collapsed");
  });

  container.appendChild(section);
}

// ─── Build one link card ──────────────────────────────────────────────────────
function _buildCard(link, index) {
  const flagged = link.issues?.length > 0;
  const card    = document.createElement("div");
  card.className    = "link-card";
  card.dataset.url  = link.url;   // used by updateLinkVT to find this card

  const tags = [];
  if (link.hostname)      tags.push({ text: link.hostname,            cls: "" });
  if (link.fileExtension) tags.push({ text: `.${link.fileExtension}`, cls: "warn" });

  const tagsHtml = tags.map(t =>
    `<span class="link-tag ${t.cls}">${t.text}</span>`
  ).join("");

  const issuesHtml = flagged
    ? `<div class="link-issues">${link.issues.map(i =>
        `<div class="link-issue-item">${i}</div>`).join("")}</div>`
    : `<div class="link-clean-msg">No issues detected</div>`;

  card.innerHTML = `
    <div class="link-card-header ${flagged ? "flagged" : "clean"}">
      <span class="link-index">${index + 1}</span>
      <span class="link-url">${link.url}</span>
    </div>
    <div class="link-card-body">
      ${tags.length ? `<div class="link-meta">${tagsHtml}</div>` : ""}
      ${issuesHtml}
      <div class="vt-result-row">${_vtText(link.virusTotal)}</div>
      ${link.abuseIPDB ? `<div class="vt-result">${_abuseText(link.abuseIPDB)}</div>` : ""}
    </div>
  `;
  return card;
}

// ─── VT text for the vt-result-row ────────────────────────────────────────────
function _vtText(vt) {
  if (!vt)               return `<div class="vt-result">🔍 VirusTotal — not checked (no API key)</div>`;
  if (vt.analysing)      return `<div class="vt-result">⏳ VirusTotal — Analysing...</div>`;
  if (vt.skipped)        return `<div class="vt-result">⏭ VirusTotal — skipped (malformed URL)</div>`;
  if (vt.queued)         return `<div class="vt-result">🕐 VirusTotal — queued at VT, check back shortly</div>`;
  if (vt.error?.includes("timeout")) return `<div class="vt-result">⏱ VirusTotal — timed out</div>`;
  if (vt.error)          return `<div class="vt-result">⚠️ VirusTotal — ${vt.error}</div>`;

  const { malicious = 0, suspicious = 0, harmless = 0, undetected = 0 } = vt;
  const total   = malicious + suspicious + harmless + undetected;
  const flagged = malicious > 0 || suspicious > 0;
  const label   = malicious > 0
    ? `❌ ${malicious} engine${malicious > 1 ? "s" : ""} flagged malicious`
    : suspicious > 0
      ? `⚠️ ${suspicious} suspicious`
      : `✓ Clean`;

  return `<div class="vt-result ${flagged ? "flagged" : ""}">
    <strong>VirusTotal</strong> — ${label}
    ${total && !flagged
      ? `<span style="color:#94a3b8;font-size:10px;margin-left:4px">${undetected} undetected / ${total}</span>`
      : ""}
  </div>`;
}

function _abuseText(abuse) {
  if (abuse.error) return `⚠️ AbuseIPDB — ${abuse.error}`;
  const score   = abuse.abuseConfidenceScore ?? 0;
  const label   = score > 75 ? "❌ High risk" : score > 25 ? "⚠️ Suspicious" : "✓ Clean";
  return `<strong>AbuseIPDB</strong> — ${label} (${score}%)${abuse.totalReports ? ` · ${abuse.totalReports} reports` : ""}`;
}

// ─── Live update: find a card by URL and update its VT row ───────────────────
// Called by popup.js when a VT_PROGRESS message arrives.
export function updateLinkVT(url, result) {
  const card = document.querySelector(`.link-card[data-url="${CSS.escape(url)}"]`);
  if (!card) return;
  const row = card.querySelector(".vt-result-row");
  if (row) row.innerHTML = _vtText(result);
}
