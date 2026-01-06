// popup/views/home-view.js
// Logic for Home (landing) view in the popup

export function initHomeView() {
  const homeView = document.getElementById("homeView");

  if (!homeView) return;

  // This view is mostly informational,
  // but we keep this file for consistency and future extensibility.
}

export function showHomeView() {
  const homeView = document.getElementById("homeView");
  if (homeView) {
    homeView.classList.add("active");
  }
}

export function hideHomeView() {
  const homeView = document.getElementById("homeView");
  if (homeView) {
    homeView.classList.remove("active");
  }
}
