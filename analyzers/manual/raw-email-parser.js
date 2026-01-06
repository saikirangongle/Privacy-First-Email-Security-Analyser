// analyzers/manual/raw-email-parser.js
// Parses raw email content into headers and body (plain text only)

export function parseRawEmail(rawEmail = "") {
  if (typeof rawEmail !== "string" || !rawEmail.trim()) {
    throw new Error("Invalid raw email content.");
  }

  // Normalize line endings
  const normalized = rawEmail.replace(/\r\n/g, "\n");

  // Split headers and body (first empty line)
  const splitIndex = normalized.indexOf("\n\n");

  let headerText = "";
  let bodyText = "";

  if (splitIndex !== -1) {
    headerText = normalized.slice(0, splitIndex);
    bodyText = normalized.slice(splitIndex + 2);
  } else {
    // Fallback: treat entire content as body
    bodyText = normalized;
  }

  // Parse headers into key-value map
  const headers = {};
  let currentHeader = null;

  headerText.split("\n").forEach(line => {
    // Header continuation (folded headers)
    if (/^\s/.test(line) && currentHeader) {
      headers[currentHeader] += " " + line.trim();
      return;
    }

    const index = line.indexOf(":");
    if (index > -1) {
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      headers[key] = value;
      currentHeader = key;
    }
  });

  return {
    summary: {
      parsedAt: new Date().toISOString(),
      headerCount: Object.keys(headers).length
    },
    headers,
    body: bodyText.trim()
  };
}
