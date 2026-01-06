# Email Security & Phishing Analyzer — Architecture

## Overview

The Email Security & Phishing Analyzer is a privacy-first browser extension designed
to help users identify phishing and suspicious emails using explainable analysis.
The extension operates entirely on user action and does not perform any background
scanning of inboxes or messages.

The system is divided into clearly separated components to ensure security,
maintainability, and transparency.

---

## High-Level Components

### 1. Popup (User Interface)

The popup acts as the **control center** of the extension. It provides:

- Analysis enable/disable toggle
- Navigation between features
- Result visualization

The popup is implemented as a **single-page UI** with dynamic views.

Files:

- `popup.html`
- `popup.css`
- `popup.js`
- `popup/views/*`
- `popup/renderers/*`

---

### 2. Background Service Worker

The background service worker is the **central coordinator**. Its responsibilities include:

- Enforcing privacy rules
- Routing analysis requests
- Injecting content scripts on demand
- Running manual analysis logic

The background never directly accesses page DOMs.

File:

- `background/background.js`

---

### 3. Content Script (Gmail Security Check)

The content script runs **only on demand** and **only on Gmail**. It:

- Extracts visible email body text
- Extracts clickable links
- Does not read headers, inboxes, or attachments

File:

- `content/gmail-content.js`

---

### 4. Analyzers

Analyzers contain **pure analysis logic** and are fully modular.

#### Gmail Analyzers

- Link analysis
- Keyword and intent detection
- Brand impersonation detection
- Risk scoring

Location:

- `analyzers/gmail/`

#### Manual Analysis Analyzers

- Raw email parsing
- Header analysis
- SPF / DKIM / DMARC interpretation
- Travel path reconstruction

Location:

- `analyzers/manual/`

---

### 5. Optional Threat Intelligence

External threat-intelligence services are optional and user-controlled.
Only URLs or IP addresses are transmitted, never email content.

File:

- `services/threat-intel.js`

---

### 6. Utilities

Utility modules provide reusable helpers for:

- Storage
- Permissions
- Validation
- Logging

Location:

- `utils/`

---

## Data Flow

### Gmail Security Check

User Action  
→ Popup  
→ Background  
→ Content Script  
→ Gmail Analyzers  
→ Results Rendered in Popup  

### Manual Email Analysis

User Action  
→ Popup  
→ Background  
→ Manual Analyzers  
→ Results Rendered in Popup  

---

## Security & Privacy Principles

- No automatic scanning
- No inbox-wide access
- User-triggered analysis only
- No hardcoded API keys
- Minimal permissions

---

## Design Rationale

The architecture prioritizes:

- Transparency
- Least privilege
- Explainability
- Academic clarity

This makes the project suitable for both real-world learning and academic evaluation.
