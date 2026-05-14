// analyzers/manual/raw-email-parser.js
// Parses raw email content into headers and body (plain text only)

export function parseRawEmail(rawEmail = "") {
  if (typeof rawEmail !== "string" || !rawEmail.trim()) {
    throw new Error("Invalid raw email content.");
  }

  // Normalize line endings
  const normalized = rawEmail.replace(/\r\n/g, "\n");

  // Split headers and body on first blank line
  const splitIndex = normalized.indexOf("\n\n");

  let headerText = "";
  let bodyText   = "";

  if (splitIndex !== -1) {
    headerText = normalized.slice(0, splitIndex);
    bodyText   = normalized.slice(splitIndex + 2);
  } else {
    // Fallback: treat entire content as body
    bodyText = normalized;
  }

  // Parse headers — accumulate duplicate keys into arrays
  // (critical for Received: headers used in travel-path analysis)
  const headers = {};
  let currentKey = null;

  headerText.split("\n").forEach(line => {
    // Folded header continuation (starts with whitespace)
    if (/^\s/.test(line) && currentKey) {
      const prev = headers[currentKey];
      if (Array.isArray(prev)) {
        prev[prev.length - 1] += " " + line.trim();
      } else {
        headers[currentKey] += " " + line.trim();
      }
      return;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx > -1) {
      const key   = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        // Duplicate key — grow into an array
        headers[key] = [].concat(headers[key], value);
      } else {
        headers[key] = value;
      }
      currentKey = key;
    }
  });

  return {
    summary: {
      parsedAt:    new Date().toISOString(),
      headerCount: Object.keys(headers).length,
    },
    headers,
    body: bodyText.trim(),
  };
}
