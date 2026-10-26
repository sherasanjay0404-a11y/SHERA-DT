"""
RuralShield AI — Network-Aware Adaptive Authentication System
Main Application Entry Point (Flask & PyMongo) with Flask-Limiter and Collective Ledgers
"""

import os
from flask import Flask, render_template
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from services.db import get_db
from services.auth_service import bootstrap_admin
from routes.auth_routes import auth_bp
from routes.webauthn_routes import webauthn_bp
from routes.totp_routes import totp_bp
from routes.offline_routes import offline_bp
from routes.collective_routes import collective_bp

def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config.from_object(Config)

    # Configure Secure Cookie Settings
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=Config.SESSION_COOKIE_SECURE,
        PERMANENT_SESSION_LIFETIME=Config.PERMANENT_SESSION_LIFETIME,
    )

    # Initialize Rate Limiter for Authentication Protection
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=[Config.RATELIMIT_DEFAULT],
        storage_uri=Config.RATELIMIT_STORAGE_URI,
    )

    # Apply strict limits on sensitive authentication blueprints
    limiter.limit(Config.RATELIMIT_LOGIN)(auth_bp)
    limiter.limit("10 per minute")(webauthn_bp)
    limiter.limit("6 per minute")(totp_bp)
    limiter.limit("10 per minute")(offline_bp)

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(webauthn_bp)
    app.register_blueprint(totp_bp)
    app.register_blueprint(offline_bp)
    app.register_blueprint(collective_bp)

    # Initialize Database & Bootstrap Admin Idempotently
    try:
        db = get_db()
        admin_info = bootstrap_admin(db)
        print(f"[RuralShield AI] Database connected. Admin status: {admin_info['status']} ({admin_info['email']})")
    except Exception as e:
        print(f"[RuralShield AI] MongoDB initialization note: {e}")

    # Serve Main UI
    @app.route("/")
    def index():
        return render_template("login.html")

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
