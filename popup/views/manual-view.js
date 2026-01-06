// popup/views/manual-view.js
// UI logic for Manual Email Analysis

export function initManualView() {
  const runBtn = document.getElementById("runManualAnalysis");
  const input = document.getElementById("rawEmailInput");
  const resultBox = document.getElementById("manualResult");

  if (!runBtn || !input || !resultBox) return;

  runBtn.addEventListener("click", () => {
    resultBox.innerHTML = "";

    const rawEmail = input.value.trim();
    if (!rawEmail) {
      resultBox.textContent = "Please paste raw email content to analyze.";
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
          resultBox.textContent = response.error;
          return;
        }

        renderManualResult(resultBox, response);
      }
    );
  });
}

// -------------------------------
// Result Renderer (Manual)
// -------------------------------

function renderManualResult(container, data) {
  container.innerHTML = "";

  // Summary
  const summary = document.createElement("div");
  summary.innerHTML = `<strong>Analysis Summary</strong>`;
  container.appendChild(summary);

  // Headers
  if (data.headers?.findings) {
    const headerList = document.createElement("ul");
    data.headers.findings.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      headerList.appendChild(li);
    });
    container.appendChild(headerList);
  }

  // Authentication
  if (data.authentication) {
    const auth = document.createElement("div");
    auth.innerHTML = `
      <strong>Authentication Results</strong><br>
      SPF: ${data.authentication.spf}<br>
      DKIM: ${data.authentication.dkim}<br>
      DMARC: ${data.authentication.dmarc}
    `;
    container.appendChild(auth);
  }

  // Travel Path
  if (data.travelPath?.hops?.length) {
    const travel = document.createElement("div");
    travel.innerHTML = `<strong>Email Travel Path</strong>`;
    const ul = document.createElement("ul");

    data.travelPath.hops.forEach(hop => {
      const li = document.createElement("li");
      li.textContent = `From ${hop.from} → By ${hop.by} (${hop.protocol})`;
      ul.appendChild(li);
    });

    travel.appendChild(ul);
    container.appendChild(travel);
  }
}
