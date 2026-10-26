"""
RuralShield AI — Application Configuration
Loads security parameters and environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Security
    SECRET_KEY = os.environ.get("SECRET_KEY", "ruralshield-insecure-dev-secret-change-in-production")
    
    # MongoDB
    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME = os.environ.get("DATABASE_NAME", "ruralshield_ai")
    
    # Initial Administrator Bootstrap
    INITIAL_ADMIN_EMAIL = os.environ.get("INITIAL_ADMIN_EMAIL", "sherasanjayn@gmail.com").lower().strip()
    INITIAL_ADMIN_PASSWORD = os.environ.get("INITIAL_ADMIN_PASSWORD", "RuralShield@2026AdminSecure!")
    
    # WebAuthn / Passkeys
    WEBAUTHN_RP_ID = os.environ.get("WEBAUTHN_RP_ID", "localhost")
    WEBAUTHN_RP_NAME = os.environ.get("WEBAUTHN_RP_NAME", "RuralShield AI")
    WEBAUTHN_ORIGIN = os.environ.get("WEBAUTHN_ORIGIN", "http://localhost:3000")
    
    # TOTP Encryption Key (32-byte key for AES-GCM)
    TOTP_ENCRYPTION_KEY = os.environ.get(
        "TOTP_ENCRYPTION_KEY",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    )
    
    # Cookie & Session Policy
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("ENVIRONMENT") == "production"
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per day;30 per hour"
    RATELIMIT_LOGIN = "5 per minute"
    RATELIMIT_STORAGE_URI = "memory://"
