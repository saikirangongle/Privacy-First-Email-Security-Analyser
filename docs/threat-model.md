# Threat Model — Email Security & Phishing Analyzer

## Purpose of Threat Modeling

The purpose of this threat model is to define:

- What security threats the extension is designed to detect
- What threats are intentionally out of scope
- How risks are mitigated using a privacy-first design

This ensures transparency and avoids false security claims.

---

## Assets Being Protected

The primary assets this extension aims to protect are:

- User awareness and decision-making
- User credentials (indirectly, by detecting phishing attempts)
- User privacy and email confidentiality

The extension does not act as a blocking or enforcement system.

---

## Threat Actors

Potential threat actors include:

- Phishers attempting to steal credentials
- Attackers distributing malicious links or files
- Social engineers exploiting urgency or trust
- Malicious domains impersonating known brands

---

## In-Scope Threats

The following threats are **explicitly addressed** by the extension:

### 1. Phishing Links

- Malicious URLs
- Shortened links hiding destinations
- IP-based URLs
- Non-HTTPS links
- Downloadable file links (any extension)

### 2. Social Engineering

- Urgency-based language
- Fear and threat messaging
- Authority impersonation
- Financial pressure tactics

### 3. Brand Impersonation

- Trusted brand names used in email body
- Mismatch between brand mentions and link domains

### 4. Suspicious Email Structure

- Minimal content with heavy link usage
- Attachment references used as lures

---

## Out-of-Scope Threats

The following threats are **intentionally excluded**:

- Malware execution prevention
- Email blocking or filtering
- Attachment sandboxing
- Zero-day exploit detection
- Sender infrastructure compromise
- Account takeover protection

These threats require server-side or enterprise-level solutions.

---

## Trust Boundaries

The extension enforces clear trust boundaries:

- Popup UI cannot access page DOM directly
- Background service worker does not access email content
- Content script has limited, scoped access
- External APIs receive only URLs or IPs

---

## Threat Mitigations

| Threat | Mitigation |
| ------ | ------------ |
| Phishing links | URL analysis & explainable warnings |
| Social engineering | Keyword & intent detection |
| Brand spoofing | Brand-domain mismatch checks |
| Privacy risks | User-triggered analysis only |

---

## Security Assumptions

- Gmail UI exposes only visible email content
- Users enable analysis knowingly
- External APIs behave as documented
- Browser extension platform enforces sandboxing

---

## Limitations & Transparency

The extension does not claim to:

- Detect all phishing emails
- Replace enterprise security solutions
- Automatically block threats

Instead, it focuses on **awareness and explanation**.

---

## Conclusion

This threat model ensures that the Email Security & Phishing Analyzer:

- Has a clearly defined security scope
- Avoids overpromising
- Maintains ethical and academic integrity
- Provides meaningful, explainable protection to users
