// utils/permissions.js
// Helpers for environment and permission-aware checks

// ===============================
// Gmail Context Check
// ===============================

export function isGmailUrl(url = "") {
  return typeof url === "string" && url.startsWith("https://mail.google.com/");
}

// ===============================
// Active Tab Gmail Check
// ===============================

export async function isActiveTabGmail() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      resolve(tab?.url ? isGmailUrl(tab.url) : false);
    });
  });
}

// ===============================
// Permission Awareness (Read-Only)
// ===============================
// MV3 + activeTab → we do NOT request permissions dynamically.
// This function exists only for clarity and future extensibility.

export function hasScriptingPermission() {
  return true; // Declared in manifest; no runtime check required
}
