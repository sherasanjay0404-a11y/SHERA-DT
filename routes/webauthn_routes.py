"""
RuralShield AI — WebAuthn Blueprints
Passkey login options, verification, and credential enrollment.
"""

from flask import Blueprint, request, jsonify, session
from services.db import get_db
from services.auth_service import log_auth_event
from services.webauthn_service import generate_challenge, prepare_login_options, prepare_registration_options
from datetime import datetime, timezone

webauthn_bp = Blueprint("webauthn_bp", __name__)

# Temporary in-memory challenge cache
_active_challenges = {}

@webauthn_bp.route("/api/webauthn/login/options", methods=["POST"])
def login_options():
    """Generates a cryptographic challenge for passkey assertion."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    
    db = get_db()
    credentials_list = []
    
    if email:
        user = db.users.find_one({"email": email})
        if user:
            credentials_list = list(db.credentials.find({"user_id": user["_id"]}))
            
    challenge = generate_challenge()
    challenge_key = str(len(_active_challenges) + 1)
    _active_challenges[challenge_key] = {
        "challenge": challenge,
        "email": email,
    }
    
    options = prepare_login_options(challenge, credentials_list)
    options["challenge_key"] = challenge_key
    return jsonify(options), 200

@webauthn_bp.route("/api/webauthn/login/verify", methods=["POST"])
def login_verify():
    """Verifies passkey assertion, invalidates challenge, and creates session."""
    data = request.get_json() or {}
    challenge_key = data.get("challenge_key")
    credential = data.get("credential")
    network_state = data.get("network_state", "STRONG")
    
    if not challenge_key or not credential:
        return jsonify({"error": "INVALID_REQUEST", "message": "Missing challenge key or assertion."}), 400
        
    stored = _active_challenges.pop(challenge_key, None)
    if not stored:
        return jsonify({"error": "CHALLENGE_EXPIRED", "message": "Challenge expired or invalid. Please retry."}), 400
        
    db = get_db()
    cred_id = credential.get("id") or credential.get("rawId")
    cred_doc = db.credentials.find_one({"credential_id": cred_id})
    
    if not cred_doc:
        log_auth_event(db, None, stored.get("email"), "PASSKEY", network_state, False, "Unregistered credential", request.remote_addr)
        return jsonify({"error": "CREDENTIAL_NOT_FOUND", "message": "Passkey is not enrolled on this account."}), 401
        
    user = db.users.find_one({"_id": cred_doc["user_id"]})
    if not user or user.get("status") != "ACTIVE":
        return jsonify({"error": "ACCOUNT_DISABLED", "message": "Account is disabled."}), 401
        
    # Increment counter & record usage
    db.credentials.update_one(
        {"_id": cred_doc["_id"]},
        {"$inc": {"counter": 1}, "$set": {"last_used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Issue session
    session.clear()
    session["user_id"] = user["_id"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    
    log_auth_event(db, user["_id"], user["email"], "PASSKEY", network_state, True, None, request.remote_addr)
    
    return jsonify({
        "success": True,
        "authenticated": True,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "role": user["role"],
        },
        "message": "Passkey verified successfully.",
    }), 200
