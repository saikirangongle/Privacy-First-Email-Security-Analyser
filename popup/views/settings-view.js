// popup/views/settings-view.js
// UI logic for user-configurable settings

export function initSettingsView() {
  const linkCheckbox = document.getElementById("enableLinkChecks");
  const keywordCheckbox = document.getElementById("enableKeywordChecks");
  const brandCheckbox = document.getElementById("enableBrandChecks");

  if (!linkCheckbox || !keywordCheckbox || !brandCheckbox) return;

  // Load saved settings
  chrome.storage.local.get("settings", res => {
    const settings = res.settings || {};

    linkCheckbox.checked =
      settings.enableLinkChecks !== false; // default true
    keywordCheckbox.checked =
      settings.enableKeywordChecks !== false;
    brandCheckbox.checked =
      settings.enableBrandChecks !== false;
  });

  // Save settings on change
  [linkCheckbox, keywordCheckbox, brandCheckbox].forEach(checkbox => {
    checkbox.addEventListener("change", saveSettings);
  });
}

function saveSettings() {
  const settings = {
    enableLinkChecks: document.getElementById("enableLinkChecks").checked,
    enableKeywordChecks: document.getElementById("enableKeywordChecks").checked,
    enableBrandChecks: document.getElementById("enableBrandChecks").checked
  };

  chrome.storage.local.set({ settings });
}
