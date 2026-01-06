// content/gmail-content.js
// Extracts visible Gmail email body text and all links
// Runs ONLY when injected by background (user-triggered)

(() => {
  const MAX_RETRIES = 20;
  const RETRY_DELAY = 200;

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // Try multiple selectors because Gmail DOM is dynamic
  function findEmailBody() {
    const selectors = [
      "div.a3s",
      "div.a3s.aiL",
      "div[data-message-id] div.a3s",
      "div[role='listitem'] div.a3s",
      "div[aria-label][dir='ltr']"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 0) {
        return el;
      }
    }
    return null;
  }

  async function extractEmailSync() {
    let bodyElement = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
      bodyElement = findEmailBody();
      if (bodyElement) break;
      await sleep(RETRY_DELAY);
    }

    if (!bodyElement) return null;

    const body = bodyElement.innerText || "";

    const links = Array.from(bodyElement.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => typeof href === "string" && href.startsWith("http"));

    return {
      body,
      links
    };
  }

  // IMPORTANT: return synchronously
  const done = async () => {
    return await extractEmailSync();
  };

  return done();
})();
