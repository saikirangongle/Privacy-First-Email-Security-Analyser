// utils/validators.js
// Generic validation helpers used across the project

// ===============================
// URL Validation
// ===============================

export function isValidUrl(value) {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ===============================
// IP Address Validation
// ===============================

export function isIpAddress(value) {
  if (typeof value !== "string") return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

// ===============================
// File Extension Detection
// ===============================

export function getFileExtensionFromUrl(url) {
  if (!isValidUrl(url)) return null;

  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const parts = lastSegment.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : null;
  } catch {
    return null;
  }
}

// ===============================
// Text Safety
// ===============================

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
