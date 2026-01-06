// popup/renderers/checklist-renderer.js
// Renders the list of security checks performed during Gmail Security Check

export function renderChecklist(container, checks = []) {
  if (!container || !Array.isArray(checks) || checks.length === 0) return;

  const wrapper = document.createElement("div");
  wrapper.className = "checklist-section";

  const title = document.createElement("h4");
  title.textContent = "Security Checks Performed";
  wrapper.appendChild(title);

  const list = document.createElement("ul");
  list.className = "checklist";

  checks.forEach(check => {
    const li = document.createElement("li");
    li.className = "checklist-item";
    li.textContent = `✔ ${check}`;
    list.appendChild(li);
  });

  wrapper.appendChild(list);
  container.appendChild(wrapper);
}
