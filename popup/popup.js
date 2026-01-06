// popup/popup.js
// Controller for popup UI and user actions (FINAL, MANUAL FIX APPLIED)

// ===============================
// IMPORT RENDERERS
// ===============================

import { renderSummary } from "./renderers/summary-renderer.js";
import { renderChecklist } from "./renderers/checklist-renderer.js";
import { renderLinks } from "./renderers/link-renderer.js";
import { renderBodyFindings } from "./renderers/body-renderer.js";
import { renderNotice, clearNotice } from "./renderers/notice-renderer.js";
import { renderManualAnalysis } from "./renderers/manual-renderer.js";

// ===============================
// VIEW MANAGEMENT
// ===============================

const views = {
  home: document.getElementById("homeView"),
  gmail: document.getElementById("gmailView"),
  manual: document.getElementById("manualView"),
  api: document.getElementById("apiView"),
  settings: document.getElementById("settingsView")
};

const navButtons = {
  home: document.getElementById("homeBtn"),
  gmail: document.getElementById("gmailBtn"),
  manual: document.getElementById("manualBtn"),
  api: document.getElementById("apiBtn"),
  settings: document.getElementById("settingsBtn")
};

function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  Object.values(navButtons).forEach(b => b.classList.remove("active"));

  views[viewName].classList.add("active");
  navButtons[viewName].classList.add("active");
}

// ===============================
// NAVIGATION EVENTS
// ===============================

navButtons.home.addEventListener("click", () => showView("home"));
navButtons.gmail.addEventListener("click", () => showView("gmail"));
navButtons.manual.addEventListener("click", () => showView("manual"));
navButtons.api.addEventListener("click", () => showView("api"));
navButtons.settings.addEventListener("click", () => showView("settings"));

// ===============================
// ANALYSIS TOGGLE
// ===============================

const analysisToggle = document.getElementById("analysisToggle");

chrome.storage.local.get("analysisEnabled", res => {
  analysisToggle.checked = Boolean(res.analysisEnabled);
});

analysisToggle.addEventListener("change", () => {
  chrome.storage.local.set({
    analysisEnabled: analysisToggle.checked
  });
});

// ===============================
// GMAIL SECURITY CHECK (UNCHANGED)
// ===============================

const runGmailBtn = document.getElementById("runGmailCheck");
const gmailResult = document.getElementById("gmailResult");
const gmailNotice = document.getElementById("gmailNotice");

runGmailBtn.addEventListener("click", async () => {
  gmailResult.innerHTML = "";
  clearNotice(gmailNotice);

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.url || !tab.url.startsWith("https://mail.google.com/")) {
    renderNotice(
      gmailNotice,
      "Gmail Security Check works only on an opened Gmail email.",
      "warning"
    );
    return;
  }

  chrome.runtime.sendMessage(
    { action: "RUN_ANALYSIS", mode: "gmail" },
    response => {
      if (response?.error) {
        renderNotice(gmailNotice, response.error, "error");
        return;
      }

      gmailResult.innerHTML = "";

      const summarySection = document.createElement("div");
      const checklistSection = document.createElement("div");
      const linksSection = document.createElement("div");
      const bodyFindingsSection = document.createElement("div");

      gmailResult.append(
        summarySection,
        checklistSection,
        linksSection,
        bodyFindingsSection
      );

      renderSummary(summarySection, {
        riskLevel: response.riskLevel,
        totalScore: response.score,
        explanation: response.explanation
      });

      renderChecklist(checklistSection, response.checksPerformed || []);
      renderLinks(linksSection, response.links || []);
      renderBodyFindings(bodyFindingsSection, {
        keywordIndicators: response.keywordIndicators || [],
        brandFindings: response.brandFindings || []
      });
    }
  );
});

// ===============================
// MANUAL EMAIL ANALYSIS (FIXED)
// ===============================

const runManualBtn = document.getElementById("runManualAnalysis");
const rawInput = document.getElementById("rawEmailInput");
const manualResult = document.getElementById("manualResult");

runManualBtn.addEventListener("click", () => {
  manualResult.innerHTML = "";

  const rawEmail = rawInput.value.trim();
  if (!rawEmail) {
    manualResult.textContent = "Please paste raw email content.";
    return;
  }

  chrome.runtime.sendMessage(
    {
      action: "RUN_ANALYSIS",
      mode: "manual",
      payload: rawEmail
    },
    response => {
      if (response?.error) {
        manualResult.textContent = response.error;
        return;
      }

      // -------------------------------
      // STRUCTURED MANUAL RENDERING
      // -------------------------------

      manualResult.innerHTML = "";

      const summarySection = document.createElement("div");
      const detailSection = document.createElement("div");
      const linksSection = document.createElement("div");

      manualResult.append(
        summarySection,
        detailSection,
        linksSection
      );

      // ✅ FIXED: Risk level handling
      renderSummary(summarySection, {
        riskLevel: response.riskLevel || "Analyzed",
        explanation:
          "Manual email analysis completed using header-level forensic checks."
      });

      // Header, auth, travel path
      renderManualAnalysis(detailSection, response);

      // ✅ FIXED: Render links in manual analysis
      renderLinks(linksSection, response.links || []);
    }
  );
});

// ===============================
// API SETTINGS (UNCHANGED)
// ===============================

document.getElementById("saveApiKeys").addEventListener("click", () => {
  const vtKey = document.getElementById("vtKey").value.trim();
  const abuseKey = document.getElementById("abuseKey").value.trim();

  chrome.storage.local.set(
    {
      apiKeys: {
        virustotal: vtKey || null,
        abuseipdb: abuseKey || null
      }
    },
    () => {
      alert("API keys saved locally.");
    }
  );
});
