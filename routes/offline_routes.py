"""
RuralShield AI — Offline Blueprints
Device provisioning and offline event synchronization.
"""

from flask import Blueprint, request, jsonify
from services.db import get_db
from services.offline_service import provision_trusted_device, sync_offline_events

offline_bp = Blueprint("offline_bp", __name__)

@offline_bp.route("/api/offline/provision", methods=["POST"])
def provision_device():
    """Online provisioning endpoint: issues a device-bound offline authorization lease."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    pin = data.get("pin", "")
    device_name = data.get("device_name", "Field Terminal")
    
    if not email or not pin or len(pin) < 4:
        return jsonify({"error": "INVALID_INPUT", "message": "Email and 4+ digit PIN required."}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "USER_NOT_FOUND", "message": "User not found."}), 404
        
    res = provision_trusted_device(db, user["_id"], user["email"], device_name, pin)
    return jsonify({
        "success": True,
        "device": res,
        "message": "Device provisioned with 7-day offline lease.",
    }), 200

@offline_bp.route("/api/offline/sync", methods=["POST"])
def sync_events():
    """Synchronizes locally signed offline events once network connectivity returns."""
    data = request.get_json() or {}
    events = data.get("events", [])
    
    if not isinstance(events, list):
        return jsonify({"error": "INVALID_INPUT", "message": "Events list required."}), 400
        
    db = get_db()
    accepted, rejected = sync_offline_events(db, events)
    
    return jsonify({
        "success": True,
        "synced_count": accepted,
        "rejected_count": rejected,
        "message": f"Successfully synchronized {accepted} offline events.",
    }), 200
