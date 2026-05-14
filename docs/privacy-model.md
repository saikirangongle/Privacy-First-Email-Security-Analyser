# Privacy Model — Email Security & Phishing Analyzer

## Privacy-First Philosophy

The Email Security & Phishing Analyzer is designed with **privacy as a core principle**.
The extension does not operate silently, does not scan inboxes, and does not collect
or transmit personal email content without explicit user action.

All analysis is **user-triggered** and **transparent**.

---

## Default Behavior

- Analysis is **disabled by default**
- No emails are read automatically
- No background monitoring is performed
- The extension remains idle until the user interacts with it

This ensures that users are always in control.

---

## Gmail Security Check Privacy

For Gmail-based checks:

- Only the **currently opened email** is analyzed
- Only **visible body content and links** are accessed
- No headers are accessed
- No attachments are accessed or downloaded
- No inbox-wide scanning is performed

The content script runs **only on demand** and exits immediately after extraction.

---

## Manual Email Analysis Privacy

For manual analysis:

- Users must explicitly paste raw email content
- The extension treats input as **plain text**
- No HTML rendering occurs
- No automatic network calls are made

This mode works on **any website** and requires **no Gmail permissions**.

---

## External API Usage

Threat-intelligence services (e.g., VirusTotal, AbuseIPDB) are:

- **Optional**
- **User-configured**
- **Disabled by default**

When enabled:

- Only URLs or IP addresses are sent
- Email body content and headers are never transmitted
- API keys are stored locally in the browser

---

## Data Storage

The extension uses `chrome.storage.local` to store:

- User preferences
- Analysis toggle state
- Optional API keys

No data is synced externally or stored on remote servers.

---

## Permissions Justification

| Permission | Purpose |
| --------- | -------- |
| storage | Store user settings and API keys |
| activeTab | Access Gmail only after user action |
| scripting | Inject content script on demand |

No unnecessary permissions are requested.

---

## User Control

Users can:

- Enable or disable analysis at any time
- Clear stored data manually
- Choose whether to use external APIs

The extension never overrides user decisions.

---

## Ethical Considerations

- No covert data collection
- No attachment scraping
- No bypassing email provider protections
- No behavioral tracking

The tool is designed for **education, awareness, and transparency**.

---

## Summary

This privacy model ensures that the Email Security & Phishing Analyzer is:

- Ethical
- Transparent
- User-controlled
- Academically sound
- Compliant with browser extension best practices
