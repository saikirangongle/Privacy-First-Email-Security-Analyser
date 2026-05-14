// analyzers/manual/travel-map.js
// Reconstructs email travel path from Received headers (manual analysis)

export function analyzeTravelPath(headers = {}) {
  if (!headers || typeof headers !== "object") {
    return {
      hops: [],
      explanation: "No headers available to analyze the email travel path."
    };
  }

  // Collect all 'Received' headers (can be multiple)
  const received = [];
  Object.keys(headers).forEach(key => {
    if (key.toLowerCase() === "received") {
      const value = headers[key];
      if (Array.isArray(value)) {
        received.push(...value);
      } else if (typeof value === "string") {
        received.push(value);
      }
    }
  });

  if (received.length === 0) {
    return {
      hops: [],
      explanation: "No Received headers found. Travel path cannot be reconstructed."
    };
  }

  // Parse each Received header into a hop
  const hops = received.map((line, index) => {
    // Basic parsing (best-effort, explainable)
    const fromMatch = line.match(/from\s+([^\s]+)/i);
    const byMatch = line.match(/by\s+([^\s]+)/i);
    const withMatch = line.match(/with\s+([^\s]+)/i);
    const dateMatch = line.match(/;\s*(.+)$/);

    return {
      hop: index + 1,
      from: fromMatch ? fromMatch[1] : "Unknown",
      by: byMatch ? byMatch[1] : "Unknown",
      protocol: withMatch ? withMatch[1] : "Unknown",
      timestamp: dateMatch ? dateMatch[1] : "Unknown"
    };
  });

  // Received headers are listed newest-first; reverse to show actual travel order
  const orderedHops = hops.reverse();

  return {
    hops: orderedHops,
    explanation:
      "The travel path shows how the email moved between mail servers before reaching the recipient."
  };
}
