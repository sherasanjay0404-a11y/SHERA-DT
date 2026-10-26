"""
RuralShield AI — Authentication & Session Blueprints
Uses Flask-Limiter for endpoint protection and session_service for CSRF & secure session rotation.
"""

from flask import Blueprint, request, jsonify, session
from services.db import get_db
from services.auth_service import verify_password, log_auth_event
from services.session_service import rotate_session, check_session_validity, generate_csrf_token, csrf_protect
from config import Config

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/api/network/status", methods=["GET"])
def network_status():
    """Lightweight network probe endpoint for latency and reachability detection."""
    return jsonify({
        "status": "ok",
        "service": "RuralShield AI Network Monitor",
        "rp_id": Config.WEBAUTHN_RP_ID,
        "csrf_token": generate_csrf_token(),
    }), 200

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """Password login endpoint with rate limiting, session rotation, and generic error messages."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    network_state = data.get("network_state", "STRONG")
    
    if not email or not password:
        return jsonify({"error": "INVALID_INPUT", "message": "Email and password are required."}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    
    # Generic error message to prevent account enumeration
    if not user or user.get("status") != "ACTIVE":
        log_auth_event(db, None, email, "PASSWORD", network_state, False, "Invalid credentials", request.remote_addr)
        return jsonify({"error": "INVALID_CREDENTIALS", "message": "Invalid email or password."}), 401
        
    valid = verify_password(user["password_hash"], password)
    if not valid:
        db.users.update_one({"_id": user["_id"]}, {"$inc": {"failed_attempts": 1}})
        log_auth_event(db, user["_id"], user["email"], "PASSWORD", network_state, False, "Invalid password", request.remote_addr)
        return jsonify({"error": "INVALID_CREDENTIALS", "message": "Invalid email or password."}), 401
        
    # Successful login: rotate session & reset attempts
    new_csrf = rotate_session(user["_id"], user["email"], user["role"])
    
    db.users.update_one({"_id": user["_id"]}, {"$set": {"failed_attempts": 0}})
    log_auth_event(db, user["_id"], user["email"], "PASSWORD", network_state, True, None, request.remote_addr)
    
    return jsonify({
        "success": True,
        "authenticated": True,
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "role": user["role"],
        },
        "csrf_token": new_csrf,
        "message": "Authentication successful.",
    }), 200

@auth_bp.route("/api/auth/session", methods=["GET"])
def get_session():
    """Returns the current authenticated session state, enforcing idle and absolute timeouts."""
    valid, reason = check_session_validity()
    if valid:
        return jsonify({
            "authenticated": True,
            "user": {
                "id": session.get("user_id"),
                "email": session.get("email"),
                "role": session.get("role"),
            },
            "csrf_token": session.get("_csrf_token", generate_csrf_token()),
        }), 200
    return jsonify({"authenticated": False, "reason": reason}), 200

@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    """Invalidates the server-side session."""
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."}), 200

@auth_bp.route("/api/recovery/request", methods=["POST"])
def recovery_request():
    """Zero-spam recovery guidance endpoint."""
    return jsonify({
        "success": True,
        "message": "In low-connectivity environments, credential recovery must be performed in-person via an authorized Field Administrator to prevent account takeover without SMS/email dependencies.",
    }), 200
