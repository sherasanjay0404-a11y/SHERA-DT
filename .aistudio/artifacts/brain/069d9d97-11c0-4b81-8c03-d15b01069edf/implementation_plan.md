# RuralShield AI: Network-Aware Adaptive Authentication System

RuralShield AI is a cybersecurity authentication system engineered for low-connectivity and intermittent environments. It implements the **Network-Aware Adaptive Authentication Algorithm (NAAA)**, dynamically recommending and verifying the optimal authentication mechanism based on real-time network conditions while strictly preserving cryptographic security and zero-trust verification.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during Phase 1 clarification:
> - **Dual Delivery**: We deliver a full-featured live interactive web application running in this environment (with full cryptographic verification of WebAuthn, RFC 6238 TOTP, and device-bound offline PINs) together with a production-ready, exportable Python Flask & PyMongo package (`app.py`, `config.py`, `requirements.txt`, `tests/`, `README.md`).
> - **Setup & Enrollment Drawer**: An integrated Credential Enrollment & Testing Drawer will allow testers to register real browser WebAuthn passkeys, configure TOTP authenticator secrets with live QR/time counters, and provision device-bound offline PINs with one click.
> - **Network Simulation Toolbar**: An intuitive top simulation bar will allow testing real network latency and toggling between Strong (<500ms), Weak (>500ms with jitter), and Offline states without needing physical network disconnection.

---

## 1. Overview & Core Concept

### What It Does
RuralShield AI eliminates reliance on SMS OTPs and brittle centralized auth handshakes when users operate in rural or degraded network zones. The system monitors network quality continuously via lightweight probing and automatically directs users to the most resilient, secure verification path:

1. **Strong Network ($\le 500\text{ms}$)**: Primary recommendation is **WebAuthn Passkey (FIDO2)** — hardware-backed cryptographic assertion offering phishing resistance.
2. **Weak Network ($> 500\text{ms}$ / packet loss)**: Primary recommendation is **RFC 6238 TOTP** — generates 6-digit codes on standard authenticator apps (Google Authenticator, Microsoft Authenticator, 1Password) with lightweight server validation and replay protection.
3. **Offline Mode (No connectivity)**: Primary recommendation is **Trusted Device PIN** — verifies device-bound cryptographic tokens provisioned during previous online sessions, enforces local attempt limits, and queues signed offline authentication events for background synchronization upon reconnection.

### Target Persona & Key Value
Field operators, rural healthcare workers, agricultural specialists, and administrative personnel operating in bandwidth-constrained or intermittent environments. Zero SMS reliance, zero fallback to unverified states, and full cryptographic rigor across every state.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
Built according to the specified light-theme cybersecurity SaaS palette:
- **Primary Forest Green**: `#166534` (Primary actions, brand anchors, focus states)
- **Emerald Accent**: `#10B981` (Verification highlights, strong connection indicator)
- **Canvas Neutral**: `#F8FAFC` (Clean slate-50 background)
- **Surface**: `#FFFFFF` (Single-elevation card with hairline `#E2E8F0` border)
- **Primary Text**: `#1F2937` (Slate-800 text with high contrast)
- **Secondary Text**: `#64748B` (Muted slate-500 typography)
- **Warning State**: Amber (`#D97706` / `#F59E0B`)
- **Error State**: Crimson (`#DC2626`)
- **Offline State**: Slate Blue (`#2563EB`)

### Typographic Hierarchy & Anti-Slop Discipline
- **Display Type**: `Plus Jakarta Sans` for clean, contemporary geometric structure.
- **Body Prose**: `Public Sans` / `Plus Jakarta Sans` for high legibility at 14px–16px.
- **Data & Telemetry**: Monospace figures with `tabular-nums` for latency millisecond counters and 6-digit TOTP input fields.
- **Zero-Pill Discipline**: No decorative pill badges, no pulsing fake dots on static text, no comment headers (`// 01 AUTH`). Natural title case and clean unboxed metadata with bullet separators (`·`).

### Desktop & Mobile Layout Architecture
- **Desktop (1440px baseline)**:
  - **Left Hero Column**: RuralShield AI brand mark, mission statement ("Authentication That Works Even When the Network Doesn't"), core NAAA matrix overview, and live network diagnostic status.
  - **Right Column**: Focused, clean authentication card. Features email/password input, dynamic recommended method callout, one-click WebAuthn trigger, 6-digit TOTP input, and offline device PIN unlock with fallback selectors.
- **Top Bar**: Network Simulator Bar (Real Network, Strong, Weak, Offline) + Credential Enrollment Drawer trigger + Export Code button.
- **Mobile (<768px)**: Seamless vertical stack, touch targets $\ge 44\text{px}$, sticky top bar under 15% viewport height, zero horizontal overflow.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Dual-Engine Architecture (Node.js Live Preview + Python Flask Package)
- **Chosen Approach**: Build a fully functional Node.js/Express server implementing the exact Flask REST API contract (`/api/network/status`, `/api/auth/login`, `/api/webauthn/...`, `/api/totp/...`, `/api/offline/...`, `/api/recovery/...`) with real WebAuthn and TOTP verification, alongside a complete, runnable Python Flask + PyMongo repository (`app.py`, `config.py`, `requirements.txt`, `routes/`, `services/`, `tests/`).
- **Why**: The cloud runtime requires a Node.js server on Port 3000 to render the live web preview for evaluation and interaction. Providing both gives the user immediate interactive testing in the cloud sandbox and the exact requested Python/Flask/MongoDB production codebase.

### 2. Administrator Bootstrap & Role-Based Access
- **Chosen Approach**: The initial administrator (`sherasanjayn@gmail.com`) is seeded via environment configuration (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`). Password hashing uses Argon2id/scrypt. Seeding is strictly idempotent: existing records are never overwritten on server restart.
- **Security Guarantee**: Admin privileges are never conferred by email matching alone. Verification requires authentic credentials and valid multi-factor verification.

### 3. Real WebAuthn Passkeys in Browser
- **Chosen Approach**: Use the browser's native `navigator.credentials.get()` and `navigator.credentials.create()` with server-issued cryptographically secure challenges, relying party verification, and credential public key assertion checks.
- **Why**: Ensures zero mock WebAuthn. Testers on modern laptops or phones can register TouchID, Windows Hello, or hardware security keys.

### 4. Device-Bound Offline PIN Authentication
- **Chosen Approach**: When online, a device generates a local cryptographic key pair and registers a trusted device authorization record signed with a time-limited lease (e.g. 7 days). Offline verification validates the user PIN against the device-bound key (via PBKDF2/WebCrypto), checks lease expiration and attempt limits (max 5 attempts before local lockout), and stores signed offline authentication logs for automatic synchronization upon network reconnection.
- **Why**: Complies with strict security rules — never stores plaintext PINs or server passwords in localStorage, never grants unrestricted server sessions while disconnected, and clearly labels offline access as "Locally verified — offline access".

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RURALSHIELD AI FRONTEND                         │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Network Monitor      │  │ Dynamic NAAA Auth Card                 │  │
│  │ - navigator.onLine   │  │ - Method Selector (Adaptive Default)   │  │
│  │ - RTT / Latency Ping │  │ - Passkey: navigator.credentials.get() │  │
│  │ - State: Strong/Weak │  │ - TOTP: RFC 6238 6-Digit Verification  │  │
│  │   / Offline          │  │ - Offline: Trusted Device PIN Auth     │  │
│  └──────────┬───────────┘  └───────────────────┬────────────────────┘  │
└─────────────┼──────────────────────────────────┼───────────────────────┘
              │                                  │
              ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API ROUTING & SECURITY                          │
│  GET  /api/network/status   POST /api/webauthn/login/options & /verify │
│  POST /api/auth/login       POST /api/totp/verify                      │
│  POST /api/auth/logout      POST /api/offline/verify & /offline/sync   │
│  GET  /api/auth/session     POST /api/recovery/request                 │
├────────────────────────────────────────────────────────────────────────┤
│ Rate Limiter · CSRF Tokenizer · Session Rotator · Argon2id / RFC 6238  │
└────────────────────────────────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE (ruralshield_ai)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ users        │  │ credentials  │  │ totp_secrets │  │ devices    │  │
│  │ - email      │  │ - cred_id    │  │ - enc_secret │  │ - dev_id   │  │
│  │ - hash       │  │ - pubkey     │  │ - last_step  │  │ - pub_key  │  │
│  │ - role: ADMIN│  │ - counter    │  │ - enrolled   │  │ - expiry   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ authentication_events         │  │ offline_events (sync queue)   │  │
│  └───────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Collections & Schemas
- `users`: `{ _id, email, password_hash, role: 'ADMIN'|'USER', status: 'ACTIVE'|'LOCKED', created_at, updated_at }`
- `credentials` (WebAuthn): `{ _id, user_id, credential_id, public_key, counter, transports, created_at, last_used_at }`
- `totp_credentials`: `{ _id, user_id, encrypted_secret, enrolled: boolean, last_accepted_step: number, created_at }`
- `devices`: `{ _id, user_id, device_id, device_name, public_key, trust_status: 'ACTIVE'|'REVOKED', provisioned_at, expires_at }`
- `authentication_events`: `{ _id, user_id, method: 'PASSKEY'|'TOTP'|'PASSWORD'|'OFFLINE_PIN', network_state: 'STRONG'|'WEAK'|'OFFLINE', success: boolean, failure_reason, timestamp, ip_address }`
- `offline_events`: `{ _id, user_id, device_id, signature, event_type, created_at, synced_at, replay_id }`

### Verification & Testing Plan
- **Automated Test Suite**:
  1. Password login verification and Argon2id hash checks.
  2. Rate limiting and brute-force lockout handling.
  3. TOTP generation, validation, time-step drift tolerance ($\pm 1$), and replay prevention.
  4. WebAuthn challenge creation, single-use invalidation, and assertion verification.
  5. Offline device lease expiration, attempt limits (5 tries), and tamper rejection.
  6. Admin bootstrap idempotency and privilege escalation denial.
  7. Offline event signed sync upon network restoration.
