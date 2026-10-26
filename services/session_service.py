"""
RuralShield AI — Secure Session Management & CSRF Protection Service
Implements session rotation, idle/absolute timeouts, CSRF tokens, and secure cookie parameters.
"""

import secrets
import hmac
import hashlib
import time
from flask import session, request, jsonify
from functools import wraps
from config import Config

CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_FORM_NAME = "csrf_token"
SESSION_LIFETIME = 86400  # 24 hours absolute timeout
SESSION_IDLE_TIMEOUT = 1800  # 30 minutes idle timeout

def generate_csrf_token() -> str:
    """Generates a cryptographically secure token tied to the user session."""
    if "_csrf_token" not in session:
        session["_csrf_token"] = secrets.token_hex(32)
    return session["_csrf_token"]

def validate_csrf_token() -> bool:
    """Validates the incoming CSRF token against the session token."""
    # Safe methods do not require CSRF validation
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return True
        
    stored_token = session.get("_csrf_token")
    if not stored_token:
        return False
        
    # Check header first, then json body, then form data
    incoming_token = (
        request.headers.get(CSRF_HEADER_NAME)
        or (request.is_json and request.get_json(silent=True) and request.get_json(silent=True).get(CSRF_FORM_NAME))
        or request.form.get(CSRF_FORM_NAME)
    )
    
    if not incoming_token:
        return False
        
    return hmac.compare_digest(str(stored_token), str(incoming_token))

def rotate_session(user_id: str, email: str, role: str):
    """
    Rotates session ID and regenerates CSRF token upon successful authentication.
    Prevents session fixation attacks.
    """
    # Clear prior session data
    session.clear()
    
    # Establish new session
    session["user_id"] = user_id
    session["email"] = email
    session["role"] = role
    session["created_at"] = int(time.time())
    session["last_active"] = int(time.time())
    
    # Fresh CSRF token
    new_csrf = secrets.token_hex(32)
    session["_csrf_token"] = new_csrf
    return new_csrf

def check_session_validity() -> tuple[bool, str]:
    """
    Enforces idle timeout (30 min) and absolute timeout (24 hr).
    Returns (is_valid, reason).
    """
    if "user_id" not in session:
        return False, "NO_SESSION"
        
    now = int(time.time())
    created_at = session.get("created_at", now)
    last_active = session.get("last_active", now)
    
    # Absolute timeout check
    if now - created_at > SESSION_LIFETIME:
        session.clear()
        return False, "ABSOLUTE_TIMEOUT_EXPIRED"
        
    # Idle timeout check
    if now - last_active > SESSION_IDLE_TIMEOUT:
        session.clear()
        return False, "IDLE_TIMEOUT_EXPIRED"
        
    # Update last active timestamp
    session["last_active"] = now
    return True, "ACTIVE"

def require_auth(roles=None):
    """Decorator to require a valid server session and optional role check."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            valid, reason = check_session_validity()
            if not valid:
                return jsonify({"error": "UNAUTHORIZED", "message": f"Session invalid: {reason}"}), 401
                
            if roles:
                user_role = session.get("role", "USER")
                if user_role not in roles:
                    return jsonify({"error": "FORBIDDEN", "message": "Insufficient privileges."}), 403
                    
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def csrf_protect(f):
    """Decorator to enforce CSRF validation on mutating endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not validate_csrf_token():
            return jsonify({
                "error": "CSRF_FAILED",
                "message": "CSRF validation failed or token missing.",
            }), 403
        return f(*args, **kwargs)
    return decorator
