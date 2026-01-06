// popup/renderers/link-renderer.js
// Renders all links found in email body with security analysis
// Used by both Gmail Security Check & Manual Analysis

export function renderLinks(container, links = []) {
  if (!container) return;

  container.innerHTML = "";

  const title = document.createElement("h4");
  title.textContent = "Links Found in Email";
  container.appendChild(title);

  // ----------------------------------
  // No links case
  // ----------------------------------
  if (!Array.isArray(links) || links.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No links were found in the email content.";
    container.appendChild(none);
    return;
  }

  const list = document.createElement("ul");
  list.className = "link-list";

  links.forEach((link, index) => {
    const li = document.createElement("li");
    li.className = "link-item";

    // ----------------------------------
    // URL
    // ----------------------------------
    const urlDiv = document.createElement("div");
    urlDiv.innerHTML = `<strong>${index + 1}.</strong> ${link.url}`;
    li.appendChild(urlDiv);

    // ----------------------------------
    // Domain (if available)
    // ----------------------------------
    if (link.hostname) {
      const hostDiv = document.createElement("div");
      hostDiv.innerHTML = `<strong>Domain:</strong> ${link.hostname}`;
      li.appendChild(hostDiv);
    }

    // ----------------------------------
    // File Extension (if any)
    // ----------------------------------
    if (link.fileExtension) {
      const extDiv = document.createElement("div");
      extDiv.innerHTML = `<strong>File type:</strong> .${link.fileExtension}`;
      li.appendChild(extDiv);
    }

    // ----------------------------------
    // Issues (Explainable)
    // ----------------------------------
    if (Array.isArray(link.issues) && link.issues.length > 0) {
      const issuesTitle = document.createElement("div");
      issuesTitle.innerHTML = "<strong>Issues detected:</strong>";
      li.appendChild(issuesTitle);

      const issuesList = document.createElement("ul");
      link.issues.forEach(issue => {
        const issueItem = document.createElement("li");
        issueItem.textContent = issue;
        issuesList.appendChild(issueItem);
      });

      li.appendChild(issuesList);
    } else {
      const clean = document.createElement("div");
      clean.textContent = "No obvious issues detected with this link.";
      li.appendChild(clean);
    }

    // ----------------------------------
    // VirusTotal Result (if available)
    // ----------------------------------
    const vtDiv = document.createElement("div");

    if (link.virusTotal === null || link.virusTotal === undefined) {
      vtDiv.textContent =
        "VirusTotal scan not performed (API key not configured).";
    } else if (link.virusTotal?.error) {
      vtDiv.textContent = "VirusTotal scan failed for this URL.";
    } else {
      const {
        malicious = 0,
        suspicious = 0,
        harmless = 0
      } = link.virusTotal;

      vtDiv.innerHTML = `
        <strong>VirusTotal:</strong>
        ${malicious > 0 ? `❌ Malicious (${malicious})` : "✔ No malicious detections"},
        ${suspicious > 0 ? `⚠ Suspicious (${suspicious})` : "✔ Not suspicious"},
        ✔ Harmless (${harmless})
      `;
    }

    li.appendChild(vtDiv);
    list.appendChild(li);
  });

  container.appendChild(list);
}
