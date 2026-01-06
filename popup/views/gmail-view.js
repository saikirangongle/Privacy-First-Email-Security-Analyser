// popup/views/gmail-view.js
// UI logic for Gmail Security Check view

export function initGmailView() {
  const runBtn = document.getElementById("runGmailCheck");
  const notice = document.getElementById("gmailNotice");
  const resultBox = document.getElementById("gmailResult");

  if (!runBtn || !notice || !resultBox) return;

  runBtn.addEventListener("click", async () => {
    resultBox.innerHTML = "";
    notice.classList.add("hidden");

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.url || !tab.url.startsWith("https://mail.google.com/")) {
      notice.classList.remove("hidden");
      return;
    }

    chrome.runtime.sendMessage(
      { action: "RUN_ANALYSIS", mode: "gmail" },
      response => {
        if (response?.error) {
          resultBox.textContent = response.error;
          return;
        }

        renderGmailResult(resultBox, response);
      }
    );
  });
}

// -------------------------------
// Result Renderer (Gmail)
// -------------------------------

function renderGmailResult(container, data) {
  container.innerHTML = "";

  const risk = document.createElement("div");
  risk.innerHTML = `<strong>Risk Level:</strong> ${data.riskLevel}`;
  container.appendChild(risk);

  const findings = document.createElement("ul");
  data.findings.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    findings.appendChild(li);
  });

  container.appendChild(findings);
}
