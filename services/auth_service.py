"""
RuralShield AI — Authentication Service
Argon2id password hashing, idempotent bootstrap, and session auditing.
"""

import uuid
from datetime import datetime, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from config import Config

ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def hash_password(plaintext: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(plaintext)

def verify_password(stored_hash: str, candidate: str) -> bool:
    """Verifies a candidate password against an Argon2id hash."""
    try:
        return ph.verify(stored_hash, candidate)
    except (VerifyMismatchError, VerificationError):
        return False

def bootstrap_admin(database) -> dict:
    """
    Idempotently creates the initial administrator from server-side environment variables.
    Never overwrites password or role if the administrator already exists.
    """
    admin_email = Config.INITIAL_ADMIN_EMAIL
    existing = database.users.find_one({"email": admin_email})
    
    if existing:
        return {"status": "exists", "email": admin_email, "role": existing.get("role", "ADMIN")}
    
    # Create new administrator account
    pwd_hash = hash_password(Config.INITIAL_ADMIN_PASSWORD)
    user_doc = {
        "_id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": pwd_hash,
        "role": "ADMIN",
        "status": "ACTIVE",
        "failed_attempts": 0,
        "locked_until": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    database.users.insert_one(user_doc)
    return {"status": "created", "email": admin_email, "role": "ADMIN"}

def log_auth_event(database, user_id, email, method, network_state, success, failure_reason=None, ip_address="127.0.0.1"):
    """Records an audit event in the authentication_events collection."""
    event = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "email": email,
        "method": method,  # 'PASSKEY', 'TOTP', 'PASSWORD', 'OFFLINE_PIN'
        "network_state": network_state,  # 'STRONG', 'WEAK', 'OFFLINE'
        "success": bool(success),
        "failure_reason": failure_reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": ip_address,
    }
    database.authentication_events.insert_one(event)
