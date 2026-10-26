# RuralShield AI — Network-Aware Adaptive Authentication System

RuralShield AI implements the **Network-Aware Adaptive Authentication Algorithm (NAAA)**, dynamically matching user authentication to real-time network conditions:

| Network Condition | Recommended Method | Verification Mechanism | Resilience Benefit |
| :--- | :--- | :--- | :--- |
| **STRONG NETWORK** ($\le 500\text{ms}$) | **Passkey (WebAuthn)** | Native FIDO2 hardware cryptographic assertion (`navigator.credentials.get()`) | Phishing-resistant, zero password exposure |
| **WEAK NETWORK** ($> 500\text{ms}$) | **TOTP (RFC 6238)** | 6-digit authenticator code with server drift check ($\pm 1$ step) & replay prevention | Minimal bandwidth payload, operates with intermittent connectivity |
| **OFFLINE** (No connectivity) | **Trusted Device PIN** | Device-bound cryptographic lease verification with attempt lockout and signed event queue | Uninterrupted field access without phone signal or SMS reliance |

---

## Windows & PowerShell Setup Guide

### 1. Prerequisites
- **Python 3.10 or higher**: Verify with `python --version`
- **MongoDB**: Either local [MongoDB Community Server](https://www.mongodb.com/try/download/community) running on port 27017 or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 2. Create and Activate Virtual Environment
Open **PowerShell** in the project directory:

```powershell
# Create the virtual environment
python -m venv venv

# If PowerShell script execution is restricted, allow it for current user:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the template and configure your secrets:

```powershell
Copy-Item .env.example .env
```

Open `.env` in your editor and configure:
```ini
SECRET_KEY="generate-a-random-32-character-secret"
MONGODB_URI="mongodb://localhost:27017"
DATABASE_NAME="ruralshield_ai"
INITIAL_ADMIN_EMAIL="sherasanjayn@gmail.com"
INITIAL_ADMIN_PASSWORD="YourStrongAdminPassword2026!"
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_ORIGIN="http://localhost:3000"
TOTP_ENCRYPTION_KEY="64-char-hex-key-for-aes-256"
```

### 5. Start the Application
```powershell
python app.py
```
Open your browser at **http://localhost:3000**.

### 6. Run Automated Security Tests
```powershell
pytest -v tests/test_auth.py
```

---

## Live Interactive Preview Capabilities
When running in the web preview:
1. **Network Simulator Bar**: Easily toggle between **Real Network**, **Strong (<500ms)**, **Weak (>500ms with jitter)**, and **Offline Mode**.
2. **Setup & Enrollment Drawer**: Single-click enrollment of real WebAuthn Passkeys, TOTP Authenticator Secrets with live time-step timers, and Trusted Device PINs (7-day leases).
3. **Offline Event Sync**: When logging in via Trusted Device PIN while disconnected, authentication events are queued and automatically synchronized once connectivity is restored.
