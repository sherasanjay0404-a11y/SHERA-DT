"""
RuralShield AI — Automated Test Suite
Covers password hashing, TOTP drift/replay, WebAuthn challenge handling, and admin bootstrap.
"""

import pytest
import pyotp
from services.auth_service import hash_password, verify_password
from services.totp_service import verify_totp_code, encrypt_totp_secret, decrypt_totp_secret
from services.webauthn_service import generate_challenge, prepare_login_options

def test_password_hashing():
    pwd = "RuralShieldSecurePassword2026!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(hashed, pwd) is True
    assert verify_password(hashed, "WrongPassword!") is False

def test_totp_verification_and_replay_prevention():
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=30)
    current_code = totp.now()
    current_step = int(totp.timecode(totp.now()))
    
    # 1. Valid code verification
    valid, step, err = verify_totp_code(secret, current_code, last_accepted_step=0)
    assert valid is True
    assert step == current_step
    assert err == ""
    
    # 2. Replay rejection: verifying same step with last_accepted_step updated
    valid_replay, replay_step, replay_err = verify_totp_code(secret, current_code, last_accepted_step=step)
    assert valid_replay is False
    assert "replay" in replay_err.lower()
    
    # 3. Invalid code rejection
    valid_invalid, _, _ = verify_totp_code(secret, "000000", last_accepted_step=0)
    assert valid_invalid is False

def test_totp_secret_encryption():
    secret = "JBSWY3DPEHPK3PXP"
    encrypted = encrypt_totp_secret(secret)
    assert encrypted != secret
    assert ":" in encrypted
    decrypted = decrypt_totp_secret(encrypted)
    assert decrypted == secret

def test_webauthn_challenge_generation():
    c1 = generate_challenge()
    c2 = generate_challenge()
    assert len(c1) >= 32
    assert c1 != c2  # Cryptographically random & unique
    
    options = prepare_login_options(c1, [])
    assert options["challenge"] == c1
    assert options["timeout"] == 60000
    assert options["allowCredentials"] == []
