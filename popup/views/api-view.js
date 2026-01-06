// popup/views/api-view.js
// UI logic for API key configuration (VirusTotal / AbuseIPDB)

export function initApiView() {
  const vtInput = document.getElementById("vtKey");
  const abuseInput = document.getElementById("abuseKey");
  const saveBtn = document.getElementById("saveApiKeys");

  if (!vtInput || !abuseInput || !saveBtn) return;

  // Load existing keys (if any)
  chrome.storage.local.get("apiKeys", res => {
    const keys = res.apiKeys || {};
    vtInput.value = keys.virustotal || "";
    abuseInput.value = keys.abuseipdb || "";
  });

  // Save keys
  saveBtn.addEventListener("click", () => {
    const vtKey = vtInput.value.trim();
    const abuseKey = abuseInput.value.trim();

    chrome.storage.local.set(
      {
        apiKeys: {
          virustotal: vtKey || null,
          abuseipdb: abuseKey || null
        }
      },
      () => {
        alert("API keys saved locally. Analysis will use them when required.");
      }
    );
  });
}
