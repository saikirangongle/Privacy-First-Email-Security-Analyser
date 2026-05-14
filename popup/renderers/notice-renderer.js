// notice-renderer.js

export function renderNotice(container, message, type = "info") {
  if (!container || !message) return;
  container.innerHTML = "";
  const icons = { info: "ℹ️", warning: "⚠️", error: "❌", success: "✅" };
  const div = document.createElement("div");
  div.className = `notice ${type}`;
  div.innerHTML = `<span class="notice-icon">${icons[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(div);
}

export function clearNotice(container) {
  if (container) container.innerHTML = "";
}
