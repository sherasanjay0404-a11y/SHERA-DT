"""
RuralShield AI — Database Service
MongoDB connection and collection index management.
"""

from pymongo import MongoClient, ASCENDING
from config import Config

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=2000)
        _db = _client[Config.DATABASE_NAME]
        init_indexes(_db)
    return _db

def init_indexes(database):
    """Ensure required unique indexes exist on core collections."""
    try:
        database.users.create_index([("email", ASCENDING)], unique=True)
        database.credentials.create_index([("credential_id", ASCENDING)], unique=True)
        database.credentials.create_index([("user_id", ASCENDING)])
        database.totp_credentials.create_index([("user_id", ASCENDING)], unique=True)
        database.devices.create_index([("device_id", ASCENDING)], unique=True)
        database.devices.create_index([("user_id", ASCENDING)])
        database.offline_events.create_index([("replay_id", ASCENDING)], unique=True)
        database.authentication_events.create_index([("timestamp", ASCENDING)])
    except Exception as e:
        # If running offline or in mock test mode, log gracefully
        print(f"[DB] Index initialization note: {e}")
