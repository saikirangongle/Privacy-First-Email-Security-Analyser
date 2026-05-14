// utils/logger.js
// Lightweight logger with environment-based control

const ENABLE_DEBUG = false; // flip to true for debugging // set to false for production / demo

function format(level, message, data) {
  const time = new Date().toISOString();
  return `[${time}] [${level}] ${message}${data ? " | " + JSON.stringify(data) : ""}`;
}

export function logInfo(message, data = null) {
  if (!ENABLE_DEBUG) return;
  console.info(format("INFO", message, data));
}

export function logWarn(message, data = null) {
  if (!ENABLE_DEBUG) return;
  console.warn(format("WARN", message, data));
}

export function logError(message, data = null) {
  if (!ENABLE_DEBUG) return;
  console.error(format("ERROR", message, data));
}
