// utils/storage.js
// Centralized wrapper around chrome.storage.local

// ===============================
// Generic Helpers
// ===============================

export function getValue(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      resolve(result[key]);
    });
  });
}

export function setValue(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export function removeValue(key) {
  return new Promise(resolve => {
    chrome.storage.local.remove(key, () => resolve());
  });
}

export function clearStorage() {
  return new Promise(resolve => {
    chrome.storage.local.clear(() => resolve());
  });
}

// ===============================
// Specific Helpers (Optional)
// ===============================

export async function isAnalysisEnabled() {
  return Boolean(await getValue("analysisEnabled"));
}

export async function getApiKeys() {
  return (await getValue("apiKeys")) || {};
}

export async function saveApiKeys(keys = {}) {
  await setValue("apiKeys", {
    virustotal: keys.virustotal || null,
    abuseipdb: keys.abuseipdb || null
  });
}
