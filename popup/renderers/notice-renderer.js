// popup/renderers/notice-renderer.js
// Renders informational notices and warnings in the popup

export function renderNotice(container, message, type = "info") {
  if (!container || !message) return;

  container.innerHTML = "";

  const notice = document.createElement("div");
  notice.classList.add("notice");

  // Optional severity styling hook
  notice.dataset.type = type; // info | warning | error

  notice.textContent = message;
  container.appendChild(notice);
}

export function clearNotice(container) {
  if (!container) return;
  container.innerHTML = "";
}
