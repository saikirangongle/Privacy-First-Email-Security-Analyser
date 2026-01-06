# 📧 Email Security & Phishing Analyzer

A **privacy-first browser extension** that helps users identify phishing and suspicious emails using **explainable security analysis**.

The project focuses on **user control, transparency, and education**, rather than silent background scanning or enterprise-only security models.

---

## 🎯 Project Goals

- Help users detect phishing emails
- Explain *why* an email may be suspicious
- Respect user privacy and consent
- Work entirely on the client side
- Avoid inbox-wide or background scanning

---

## 🧠 Key Features

### 🔵 Gmail Security Check

A quick security check for **opened Gmail emails**, based on **email body content only**.

Detects:

- Suspicious and malicious links
- Downloadable file links (all extensions)
- URL shorteners and IP-based URLs
- Non-HTTPS links
- Social-engineering language (urgency, fear, pressure)
- Brand impersonation attempts

📌 **No headers, attachments, or inbox data are accessed in this mode.**

---

### 🔵 Manual Email Analysis

A deeper forensic analysis mode where users can **paste raw email content** (headers + body).

Analyzes:

- Header anomalies
- SPF / DKIM / DMARC authentication results
- Email travel path (Received headers)
- Structural red flags

This mode works on **any website** and does **not require Gmail access**.

---

## 🔐 Privacy-First Design

- Analysis is **disabled by default**
- No automatic scanning
- No background monitoring
- No hardcoded API keys
- No silent data collection

All analysis is **user-triggered and transparent**.

---

## 🌐 Optional Threat Intelligence

Users may optionally configure their own API keys for:

- VirusTotal (URL reputation)
- AbuseIPDB (IP reputation)

Only **URLs or IP addresses** are sent to these services.  
Email content and headers are **never transmitted**.

---

## 🏗️ Architecture Overview

Popup UI
↓
Background Service Worker
↓
Content Script (Gmail only) OR Manual Parsers
↓
Analyzers
↓
Explainable Results

The architecture follows:

- Least-privilege permissions
- Clear trust boundaries
- Modular, testable components

---

## 🧪 Use Cases

- Phishing awareness for individuals
- Cybersecurity education
- Academic / final-year project
- Email forensics learning
- Security demonstrations

---

## ⚠️ Limitations (By Design)

This tool does **not**:

- Block emails
- Scan attachments automatically
- Replace enterprise email security
- Detect zero-day exploits

Instead, it focuses on **awareness and explanation**.

---

## 🎓 Academic Value

- Ethical and privacy-respecting
- Explainable security logic
- Real-world relevance
- Clear separation of concerns
- Easy to demonstrate and defend in viva

---

## 🚀 Getting Started

1. Load the extension in Chrome (`chrome://extensions`)
2. Enable Developer Mode
3. Click **Load unpacked**
4. Select the project directory
5. Open the extension popup to begin

---

## 📄 Documentation

- `docs/architecture.md`
- `docs/privacy-model.md`
- `docs/threat-model.md`

---

## 📌 License

This project is intended for **educational and academic use**.
