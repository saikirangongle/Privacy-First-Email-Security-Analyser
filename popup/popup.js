// popup/popup.js — works with the uploaded popup.html exactly

import { renderSummary }                  from "./renderers/summary-renderer.js";
import { renderChecklist }                from "./renderers/checklist-renderer.js";
import { renderLinks, updateLinkVT }      from "./renderers/link-renderer.js";
import { renderBodyFindings }             from "./renderers/body-renderer.js";
import { renderNotice, clearNotice }      from "./renderers/notice-renderer.js";
import { renderManualAnalysis }           from "./renderers/manual-renderer.js";

// ════════════════════════════════════════════════════════════════════
// VT PROGRESS LISTENER
// Receives progressive VT batch results from background.js.
// Two message types:
//   • Per-URL  → { url, result: { analysing:true } }  → shows "Analysing..."
//   • Batch done → { batchComplete:true, updatedLinks, updatedScore, updatedLevel }
//                → updates link cards + refreshes risk score badge
// ════════════════════════════════════════════════════════════════════
chrome.runtime.onMessage.addListener((message) => {
  if (message?.action !== "VT_PROGRESS") return;

  if (message.batchComplete) {
    (message.updatedLinks || []).forEach(link => {
      updateLinkVT(link.url, link.virusTotal);
    });

    // Update score pill
    const scoreEl = document.querySelector(".risk-score-pill");
    if (scoreEl && message.updatedScore !== undefined) {
      scoreEl.textContent = `Score: ${message.updatedScore}`;
    }

    // Update level badge text
    const levelEl = document.querySelector(".risk-level-badge span:last-child");
    if (levelEl && message.updatedLevel) {
      levelEl.textContent = `${message.updatedLevel} Risk`;
    }

    // Update risk header colour class
    const riskHeader = document.querySelector(".risk-header");
    if (riskHeader && message.updatedLevel) {
      riskHeader.className = `risk-header ${message.updatedLevel.toLowerCase()}`;
    }
  } else if (message.url) {
    // Per-URL "Analysing..." state
    updateLinkVT(message.url, message.result);
  }
});

// ════════════════════════════════════════════════════════════════════
// VIEW MANAGEMENT
// ════════════════════════════════════════════════════════════════════
const views = {
  home:     document.getElementById("homeView"),
  gmail:    document.getElementById("gmailView"),
  manual:   document.getElementById("manualView"),
  api:      document.getElementById("apiView"),
  settings: document.getElementById("settingsView"),
};

const navButtons = {
  home:     document.getElementById("homeBtn"),
  gmail:    document.getElementById("gmailBtn"),
  manual:   document.getElementById("manualBtn"),
  api:      document.getElementById("apiBtn"),
  settings: document.getElementById("settingsBtn"),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  Object.values(navButtons).forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  views[name].classList.add("active");
  navButtons[name].classList.add("active");
  navButtons[name].setAttribute("aria-selected", "true");
}

Object.entries(navButtons).forEach(([name, btn]) =>
  btn.addEventListener("click", () => showView(name))
);

// Home quick-nav shortcuts
document.getElementById("goToGmail") ?.addEventListener("click",  () => showView("gmail"));
document.getElementById("goToManual")?.addEventListener("click", () => showView("manual"));
document.getElementById("goToApi")   ?.addEventListener("click",  () => showView("api"));

// ════════════════════════════════════════════════════════════════════
// ANALYSIS TOGGLE
// ════════════════════════════════════════════════════════════════════
const analysisToggle = document.getElementById("analysisToggle");
const toggleStatus   = document.getElementById("toggleStatus");
const homeStatusBar  = document.getElementById("homeStatusBar");

function applyToggleUI(enabled) {
  if (toggleStatus) {
    toggleStatus.textContent = enabled ? "Enabled" : "Disabled";
    toggleStatus.className   = `toggle-status${enabled ? " active" : ""}`;
  }
  if (homeStatusBar) {
    if (enabled) {
      homeStatusBar.classList.add("enabled");
      homeStatusBar.innerHTML = "<span>✅</span><span>Analysis is enabled. Choose a mode above to begin.</span>";
    } else {
      homeStatusBar.classList.remove("enabled");
      homeStatusBar.innerHTML = "<span>⚠️</span><span>Analysis is disabled. Toggle it on to begin.</span>";
    }
  }
}

chrome.storage.local.get("analysisEnabled", res => {
  analysisToggle.checked = Boolean(res.analysisEnabled);
  applyToggleUI(analysisToggle.checked);
});

analysisToggle.addEventListener("change", () => {
  chrome.storage.local.set({ analysisEnabled: analysisToggle.checked });
  applyToggleUI(analysisToggle.checked);
});

// ════════════════════════════════════════════════════════════════════
// API KEYS — load saved keys on open + show/hide toggle
// ════════════════════════════════════════════════════════════════════
chrome.storage.local.get("apiKeys", res => {
  const keys = res.apiKeys || {};
  const vtEl    = document.getElementById("vtKey");
  const abuseEl = document.getElementById("abuseKey");
  if (vtEl)    vtEl.value    = keys.virustotal || "";
  if (abuseEl) abuseEl.value = keys.abuseipdb  || "";
});

document.querySelectorAll(".api-key-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type  = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁" : "🙈";
  });
});

document.getElementById("saveApiKeys").addEventListener("click", () => {
  const vtKey    = document.getElementById("vtKey")?.value.trim();
  const abuseKey = document.getElementById("abuseKey")?.value.trim();
  chrome.storage.local.set(
    { apiKeys: { virustotal: vtKey || null, abuseipdb: abuseKey || null } },
    () => {
      const btn = document.getElementById("saveApiKeys");
      const orig = btn.textContent;
      btn.textContent = "✅ Saved!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  );
});

// ════════════════════════════════════════════════════════════════════
// SETTINGS — load saved + auto-save on change
// ════════════════════════════════════════════════════════════════════
chrome.storage.local.get("settings", res => {
  const s = res.settings || {};
  const lc = document.getElementById("enableLinkChecks");
  const kc = document.getElementById("enableKeywordChecks");
  const bc = document.getElementById("enableBrandChecks");
  if (lc) lc.checked = s.enableLinkChecks    !== false;
  if (kc) kc.checked = s.enableKeywordChecks !== false;
  if (bc) bc.checked = s.enableBrandChecks   !== false;
});

["enableLinkChecks", "enableKeywordChecks", "enableBrandChecks"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    chrome.storage.local.set({
      settings: {
        enableLinkChecks:    document.getElementById("enableLinkChecks")?.checked !== false,
        enableKeywordChecks: document.getElementById("enableKeywordChecks")?.checked !== false,
        enableBrandChecks:   document.getElementById("enableBrandChecks")?.checked !== false,
      }
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// GMAIL SECURITY CHECK
// ════════════════════════════════════════════════════════════════════
const runGmailBtn = document.getElementById("runGmailCheck");
const gmailResult = document.getElementById("gmailResult");
const gmailNotice = document.getElementById("gmailNotice");

runGmailBtn.addEventListener("click", async () => {
  gmailResult.innerHTML = "";
  clearNotice(gmailNotice);
  gmailNotice.classList.add("hidden");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.startsWith("https://mail.google.com/")) {
    gmailNotice.classList.remove("hidden");
    renderNotice(gmailNotice, "Open a Gmail email first, then run this check.", "warning");
    return;
  }

  // Show loading state
  runGmailBtn.disabled = true;
  const btnText = runGmailBtn.querySelector(".btn-text");
  const btnSpinner = runGmailBtn.querySelector(".btn-spinner");
  if (btnText)    btnText.textContent = "Analysing...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  chrome.runtime.sendMessage({ action: "RUN_ANALYSIS", mode: "gmail" }, response => {
    // Restore button
    runGmailBtn.disabled = false;
    if (btnText)    btnText.textContent = "🔎 Analyze Opened Email";
    if (btnSpinner) btnSpinner.style.display = "none";

    if (response?.error) {
      gmailNotice.classList.remove("hidden");
      renderNotice(gmailNotice, response.error, "error");
      return;
    }

    gmailResult.innerHTML = "";

    const summarySection      = document.createElement("div");
    const checklistSection    = document.createElement("div");
    const linksSection        = document.createElement("div");
    const bodyFindingsSection = document.createElement("div");

    gmailResult.append(summarySection, checklistSection, linksSection, bodyFindingsSection);

    renderSummary(summarySection, {
      riskLevel:   response.riskLevel,
      totalScore:  response.score,
      explanation: response.explanation,
    });
    renderChecklist(checklistSection, response.checksPerformed || []);
    renderLinks(linksSection, response.links || []);
    renderBodyFindings(bodyFindingsSection, {
      keywordIndicators: response.keywordIndicators || [],
      brandFindings:     response.brandFindings     || [],
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// MANUAL EMAIL ANALYSIS
// ════════════════════════════════════════════════════════════════════
const runManualBtn = document.getElementById("runManualAnalysis");
const rawInput     = document.getElementById("rawEmailInput");
const manualResult = document.getElementById("manualResult");

runManualBtn.addEventListener("click", () => {
  manualResult.innerHTML = "";

  const rawEmail = rawInput.value.trim();
  if (!rawEmail) {
    manualResult.textContent = "Please paste raw email content.";
    return;
  }

  // Show loading state
  runManualBtn.disabled = true;
  const btnText    = runManualBtn.querySelector(".btn-text");
  const btnSpinner = runManualBtn.querySelector(".btn-spinner");
  if (btnText)    btnText.textContent = "Analysing...";
  if (btnSpinner) btnSpinner.style.display = "inline-block";

  chrome.runtime.sendMessage(
    { action: "RUN_ANALYSIS", mode: "manual", payload: rawEmail },
    response => {
      // Restore button
      runManualBtn.disabled = false;
      if (btnText)    btnText.textContent = "🔬 Analyze Email";
      if (btnSpinner) btnSpinner.style.display = "none";

      if (response?.error) {
        manualResult.textContent = response.error;
        return;
      }

      manualResult.innerHTML = "";

      const summarySection = document.createElement("div");
      const detailSection  = document.createElement("div");
      const linksSection   = document.createElement("div");

      manualResult.append(summarySection, detailSection, linksSection);

      renderSummary(summarySection, {
        riskLevel:   response.riskLevel || "Analyzed",
        totalScore:  response.score,
        explanation: response.explanation ||
          "Manual email analysis completed using header-level forensic checks.",
      });

      renderManualAnalysis(detailSection, response);
      renderLinks(linksSection, response.links || []);
    }
  );
});
