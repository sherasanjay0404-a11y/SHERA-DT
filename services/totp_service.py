"""
RuralShield AI — TOTP Service
RFC 6238 implementation, replay protection, and encrypted secret storage.
"""

import os
import pyotp
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from config import Config

def _get_aes_key() -> bytes:
    key_hex = Config.TOTP_ENCRYPTION_KEY
    try:
        raw = bytes.fromhex(key_hex)
        if len(raw) == 32:
            return raw
    except ValueError:
        pass
    # Fallback to deterministic 32-byte hash
    import hashlib
    return hashlib.sha256(key_hex.encode()).digest()

def encrypt_totp_secret(secret_base32: str) -> str:
    """Encrypts TOTP secret with AES-256-GCM."""
    aesgcm = AESGCM(_get_aes_key())
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, secret_base32.encode("utf-8"), None)
    return f"{nonce.hex()}:{ciphertext.hex()}"

def decrypt_totp_secret(encrypted_str: str) -> str:
    """Decrypts AES-256-GCM encrypted TOTP secret."""
    try:
        parts = encrypted_str.split(":")
        if len(parts) != 2:
            return encrypted_str
        nonce = bytes.fromhex(parts[0])
        ciphertext = bytes.fromhex(parts[1])
        aesgcm = AESGCM(_get_aes_key())
        return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")
    except Exception:
        return encrypted_str

def generate_new_totp_secret() -> str:
    """Generates an RFC 6238 compliant base32 secret."""
    return pyotp.random_base32()

def verify_totp_code(secret_base32: str, code: str, last_accepted_step: int) -> tuple[bool, int, str]:
    """
    Verifies a 6-digit TOTP code with time-step drift tolerance and replay prevention.
    Returns (valid, current_step, error_message).
    """
    clean_code = str(code).strip()
    if not clean_code.isdigit() or len(clean_code) != 6:
        return False, 0, "Code must be 6 digits."
        
    totp = pyotp.TOTP(secret_base32, interval=30)
    current_time_step = int(totp.timecode(totp.now()))
    
    # Check drift window: -1, 0, +1
    matched_step = None
    for drift in [0, -1, 1]:
        test_step = current_time_step + drift
        # Calculate time corresponding to this step
        test_time = test_step * 30
        if totp.at(test_time) == clean_code:
            matched_step = test_step
            break
            
    if matched_step is None:
        return False, 0, "Invalid TOTP code or expired time-step."
        
    if matched_step <= last_accepted_step:
        return False, matched_step, "Code has already been used (replay prevention)."
        
    return True, matched_step, ""
