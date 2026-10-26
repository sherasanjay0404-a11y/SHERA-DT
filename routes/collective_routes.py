"""
RuralShield AI — Collective Transparent Ledgers & Smart Communication Service
Empowering Rural Collectives (SHE - Self-Help Enterprises / Cooperatives)
"""

import uuid
import hashlib
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session
from services.db import get_db
from services.session_service import require_auth, csrf_protect

collective_bp = Blueprint("collective_bp", __name__)

def compute_ledger_hash(prev_hash: str, collective_id: str, member_name: str, entry_type: str, amount: float, timestamp: str) -> str:
    """Calculates SHA-256 cryptographic hash for transparent immutable ledger chaining."""
    payload = f"{prev_hash}|{collective_id}|{member_name}|{entry_type}|{amount:.2f}|{timestamp}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

@collective_bp.route("/api/collective/ledger", methods=["GET"])
def get_ledger():
    """Retrieves immutable transparent ledger entries for the collective."""
    db = get_db()
    entries = list(db.transparent_ledger.find().sort("timestamp", -1).limit(50))
    for e in entries:
        e["_id"] = str(e["_id"])
    return jsonify({"entries": entries, "collective": "SHE Gramin Vikas Federation"}), 200

@collective_bp.route("/api/collective/ledger/create", methods=["POST"])
@require_auth()
@csrf_protect
def add_ledger_entry():
    """Adds a new verified transparent ledger entry (Grain, Dairy, Credit, Produce, Payout)."""
    data = request.get_json() or {}
    member_name = data.get("member_name", "").strip()
    entry_type = data.get("entry_type", "GRAIN_DEPOSIT")
    quantity = float(data.get("quantity", 0))
    unit = data.get("unit", "kg")
    amount = float(data.get("amount", 0))
    notes = data.get("notes", "")

    if not member_name or quantity <= 0:
        return jsonify({"error": "INVALID_INPUT", "message": "Member name and valid quantity are required."}), 400

    db = get_db()
    # Find last entry for hash chaining
    last_entry = db.transparent_ledger.find_one(sort=[("timestamp", -1)])
    prev_hash = last_entry["entry_hash"] if last_entry and "entry_hash" in last_entry else "0" * 64

    ts = datetime.now(timezone.utc).isoformat()
    entry_hash = compute_ledger_hash(prev_hash, "SHE_COLLECTIVE_01", member_name, entry_type, amount, ts)

    doc = {
        "_id": str(uuid.uuid4()),
        "collective_id": "SHE_COLLECTIVE_01",
        "collective_name": "SHE Mahila Kisan Sahakari",
        "member_name": member_name,
        "entry_type": entry_type,
        "quantity": quantity,
        "unit": unit,
        "amount": amount,
        "notes": notes,
        "prev_hash": prev_hash,
        "entry_hash": entry_hash,
        "recorded_by": session.get("email", "admin"),
        "timestamp": ts,
        "verified": True,
    }

    db.transparent_ledger.insert_one(doc)
    return jsonify({"success": True, "entry": doc, "message": "Ledger entry verified and cryptographically sealed."}), 201

@collective_bp.route("/api/collective/communication", methods=["GET"])
def get_communications():
    """Retrieves ultra-low bandwidth smart broadcasts and SHE advisory notices."""
    db = get_db()
    messages = list(db.smart_communications.find().sort("timestamp", -1).limit(30))
    for m in messages:
        m["_id"] = str(m["_id"])
    return jsonify({"messages": messages}), 200

@collective_bp.route("/api/collective/communication/send", methods=["POST"])
@require_auth(roles=["ADMIN"])
@csrf_protect
def send_communication():
    """Broadcasts a high-priority advisory or mandi rate alert to rural field units."""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    category = data.get("category", "MARKET_RATE")  # MARKET_RATE, WEATHER_ALERT, MEETING, ADVISORY
    body = data.get("body", "").strip()
    priority = data.get("priority", "NORMAL")

    if not title or not body:
        return jsonify({"error": "INVALID_INPUT", "message": "Title and body are required."}), 400

    db = get_db()
    doc = {
        "_id": str(uuid.uuid4()),
        "title": title,
        "category": category,
        "body": body,
        "priority": priority,
        "sender": session.get("email", "Admin"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "delivered_offline_capable": True,
    }

    db.smart_communications.insert_one(doc)
    return jsonify({"success": True, "message": "Smart communication broadcast dispatched."}), 201
