"""
RuralShield AI — TOTP Blueprints
Time-based one-time password verification and enrollment.
"""

from flask import Blueprint, request, jsonify, session
from services.db import get_db
from services.auth_service import log_auth_event
from services.totp_service import verify_totp_code, decrypt_totp_secret

totp_bp = Blueprint("totp_bp", __name__)

@totp_bp.route("/api/totp/verify", methods=["POST"])
def verify_totp():
    """Verifies a 6-digit TOTP code with time-step drift tolerance and replay rejection."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    code = data.get("code", "").strip()
    network_state = data.get("network_state", "WEAK")
    
    if not email or not code:
        return jsonify({"error": "INVALID_INPUT", "message": "Email and 6-digit code are required."}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    
    # Generic error to prevent user enumeration
    if not user or user.get("status") != "ACTIVE":
        log_auth_event(db, None, email, "TOTP", network_state, False, "Invalid credentials", request.remote_addr)
        return jsonify({"error": "INVALID_CREDENTIALS", "message": "Invalid authentication credentials."}), 401
        
    totp_record = db.totp_credentials.find_one({"user_id": user["_id"]})
    if not totp_record or not totp_record.get("enrolled"):
        log_auth_event(db, user["_id"], user["email"], "TOTP", network_state, False, "TOTP not enrolled", request.remote_addr)
        return jsonify({
            "error": "TOTP_NOT_ENROLLED",
            "message": "TOTP has not been enrolled for this account. Please use an alternate permitted method.",
        }), 400
        
    secret = decrypt_totp_secret(totp_record["encrypted_secret"])
    valid, step, error_msg = verify_totp_code(secret, code, totp_record.get("last_accepted_step", 0))
    
    if not valid:
        if "replay" in error_msg.lower():
            log_auth_event(db, user["_id"], user["email"], "TOTP", network_state, False, "Replay rejected", request.remote_addr)
            return jsonify({"error": "CODE_REPLAYED", "message": "This code was already used. Please wait for the next time step."}), 400
            
        log_auth_event(db, user["_id"], user["email"], "TOTP", network_state, False, "Invalid code", request.remote_addr)
        return jsonify({"error": "INVALID_CODE", "message": "Invalid code or expired time step."}), 401
        
    # Prevent replay by persisting accepted step
    db.totp_credentials.update_one(
        {"_id": totp_record["_id"]},
        {"$set": {"last_accepted_step": step}}
    )
    
    # Rotate & establish session
    session.clear()
    session["user_id"] = user["_id"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    
    log_auth_event(db, user["_id"], user["email"], "TOTP", network_state, True, None, request.remote_addr)
    
    return jsonify({
        "success": True,
        "authenticated": True,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "role": user["role"],
        },
        "message": "TOTP verified successfully.",
    }), 200
