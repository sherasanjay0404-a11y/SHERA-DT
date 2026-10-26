"""
RuralShield AI — WebAuthn Service
Passkey challenge generation, verification, and credential handling.
"""

import os
import base64
from config import Config

def generate_challenge() -> str:
    """Generates a cryptographically random, single-use 32-byte challenge."""
    return base64.urlsafe_b64encode(os.urandom(32)).decode("utf-8").rstrip("=")

def prepare_login_options(challenge: str, credentials_list: list) -> dict:
    """Constructs WebAuthn PublicKeyCredentialRequestOptions."""
    allow_credentials = []
    for cred in credentials_list:
        allow_credentials.append({
            "id": cred["credential_id"],
            "type": "public-key",
            "transports": cred.get("transports", ["internal", "hybrid"]),
        })
        
    return {
        "challenge": challenge,
        "rpId": Config.WEBAUTHN_RP_ID,
        "timeout": 60000,
        "userVerification": "preferred",
        "allowCredentials": allow_credentials,
    }

def prepare_registration_options(challenge: str, user_id: str, email: str) -> dict:
    """Constructs WebAuthn PublicKeyCredentialCreationOptions."""
    return {
        "challenge": challenge,
        "rp": {
            "name": Config.WEBAUTHN_RP_NAME,
            "id": Config.WEBAUTHN_RP_ID,
        },
        "user": {
            "id": base64.urlsafe_b64encode(user_id.encode()).decode("utf-8").rstrip("="),
            "name": email,
            "displayName": email.split("@")[0],
        },
        "pubKeyCredParams": [
            {"alg": -7, "type": "public-key"},   # ES256
            {"alg": -257, "type": "public-key"}, # RS256
        ],
        "authenticatorSelection": {
            "userVerification": "preferred",
            "residentKey": "preferred",
        },
        "timeout": 60000,
        "attestation": "none",
    }
