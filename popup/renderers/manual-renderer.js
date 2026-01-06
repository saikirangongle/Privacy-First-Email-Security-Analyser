// popup/renderers/manual-renderer.js
// Renders full manual email analysis results in the popup UI
// NOTE: Email body preview is intentionally removed.
// Links from the body are analyzed and rendered separately.

export function renderManualAnalysis(container, data = {}) {
  if (!container || !data) return;

  container.innerHTML = "";

  // ===============================
  // HEADER ANALYSIS
  // ===============================

  if (data.headers) {
    const headerSection = document.createElement("div");
    headerSection.innerHTML = "<h4>Header Analysis</h4>";

    const list = document.createElement("ul");

    Object.entries(data.headers).forEach(([key, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${key}:</strong> ${value}`;
      list.appendChild(item);
    });

    headerSection.appendChild(list);
    container.appendChild(headerSection);
  }

  // ===============================
  // AUTHENTICATION RESULTS
  // ===============================

  if (data.authentication) {
    const authSection = document.createElement("div");
    authSection.innerHTML = "<h4>Authentication Results</h4>";

    const authList = document.createElement("ul");

    Object.entries(data.authentication).forEach(([key, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${key.toUpperCase()}:</strong> ${value}`;
      authList.appendChild(item);
    });

    authSection.appendChild(authList);
    container.appendChild(authSection);
  }

  // ===============================
  // EMAIL TRAVEL PATH
  // ===============================

  if (data.travelPath && Array.isArray(data.travelPath.hops)) {
    const travelSection = document.createElement("div");
    travelSection.innerHTML = "<h4>Email Travel Path</h4>";

    if (data.travelPath.hops.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No routing (Received) headers found.";
      travelSection.appendChild(p);
    } else {
      const table = document.createElement("table");
      table.style.width = "100%";

      const headerRow = document.createElement("tr");
      ["Hop", "From", "To", "Protocol", "Time"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      });

      table.appendChild(headerRow);

      data.travelPath.hops.forEach((hop, index) => {
        const row = document.createElement("tr");

        [
          index + 1,
          hop.from || "-",
          hop.to || "-",
          hop.protocol || "-",
          hop.time || "-"
        ].forEach(value => {
          const td = document.createElement("td");
          td.textContent = value;
          row.appendChild(td);
        });

        table.appendChild(row);
      });

      travelSection.appendChild(table);
    }

    container.appendChild(travelSection);
  }

  // ❌ Email Body (Preview) intentionally removed
  // ✔ Links extracted from body are rendered via link-renderer.js
}
