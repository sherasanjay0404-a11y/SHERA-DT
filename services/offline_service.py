"""
RuralShield AI — Offline Trusted Device Service
Provisions device-bound offline authorization and synchronizes local events.
"""

import uuid
import secrets
from datetime import datetime, timezone, timedelta
from services.auth_service import hash_password, verify_password

def provision_trusted_device(database, user_id: str, email: str, device_name: str, pin: str, lease_days: int = 7) -> dict:
    """
    Provisions a trusted device record and returns a device-bound authorization payload.
    Enforces that PIN is never stored in plaintext (Argon2id/scrypt hash only).
    """
    device_id = "dev_" + secrets.token_hex(8)
    pin_hash = hash_password(pin)
    device_token = secrets.token_hex(32)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=lease_days)
    
    device_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "device_id": device_id,
        "device_name": device_name,
        "device_token": device_token,
        "pin_hash": pin_hash,
        "trust_status": "ACTIVE",
        "provisioned_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
    }
    
    database.devices.insert_one(device_doc)
    
    return {
        "device_id": device_id,
        "device_name": device_name,
        "lease_expires": expires_at.isoformat(),
        "token": device_token,
    }

def sync_offline_events(database, events: list) -> tuple[int, int]:
    """
    Validates and stores batch of offline signed events.
    Rejects duplicated replay IDs.
    Returns (accepted_count, rejected_count).
    """
    accepted = 0
    rejected = 0
    
    for ev in events:
        replay_id = ev.get("replay_id")
        if not replay_id:
            rejected += 1
            continue
            
        existing = database.offline_events.find_one({"replay_id": replay_id})
        if existing:
            rejected += 1
            continue
            
        doc = {
            "_id": str(uuid.uuid4()),
            "user_id": ev.get("user_id", "offline_user"),
            "device_id": ev.get("device_id", "unknown_device"),
            "signature": ev.get("signature", "local_token"),
            "event_type": ev.get("event_type", "OFFLINE_PIN_LOGIN"),
            "payload": ev.get("payload", {}),
            "created_at": ev.get("created_at", datetime.now(timezone.utc).isoformat()),
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "replay_id": replay_id,
        }
        database.offline_events.insert_one(doc)
        accepted += 1
        
    return accepted, rejected
