import os
import random
from datetime import datetime, timedelta, timezone
from firebase_admin import firestore
from dotenv import load_dotenv

load_dotenv()


def _get_db():
    """Lazy Firestore client."""
    return firestore.client()


def generate_verification_code() -> str:
    """Generate a random 6-digit numeric code."""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def create_verification_record(uid: str, email: str) -> str:
    """
    Create a new verification code record in Firestore and return the code.

    - Generates a 6-digit code
    - Stores in email_verification_codes collection
    - Code expires in 10 minutes
    - Max 5 failed attempts allowed
    """
    db = _get_db()
    code = generate_verification_code()
    expiry_minutes = int(os.getenv("VERIFICATION_CODE_EXPIRY_MINUTES", "10"))

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expiry_minutes)

    doc_ref = db.collection("email_verification_codes").document()
    doc_ref.set(
        {
            "uid": uid,
            "email": email,
            "code": code,
            "created_at": firestore.SERVER_TIMESTAMP,
            "expires_at": expires_at,
            "attempts": 0,
            "verified": False,
            "verified_at": None,
        }
    )

    print(f"[verification_service] Created code {code} for {email}")
    return code


def verify_code(uid: str, code: str) -> dict:
    """
    Verify the provided code for a user.
    Returns: {"success": bool, "message": str, "attempts_left": int}
    """
    db = _get_db()
    max_attempts = int(os.getenv("VERIFICATION_MAX_ATTEMPTS", "5"))

    # Find the latest unverified code for this user
    docs = (
        db.collection("email_verification_codes")
        .where("uid", "==", uid)
        .where("verified", "==", False)
        .get()
    )

    if not docs:
        return {"success": False, "message": "No verification code found", "attempts_left": 0}

    # Instead of blindly guessing the strict chronological newest code (which breaks if emails are delayed),
    # simply evaluate ALL active, unverified codes for this user!
    now_time = datetime.now(timezone.utc)
    
    matched_doc = None
    latest_doc = None
    max_time_found = 0
    
    # 1. Search for a match in all active codes
    for doc in docs:
        record = doc.to_dict()
        
        # Also track the absolute newest doc to increment attempts if no match is found
        t = record.get("expires_at")
        t_val = t.timestamp() if hasattr(t, "timestamp") else 0
        if t_val > max_time_found:
            max_time_found = t_val
            latest_doc = doc
            
        if record.get("code") == code:
            expires_at = record.get("expires_at")
            if expires_at and now_time > expires_at:
                continue # expired match
                
            attempts = record.get("attempts", 0)
            if attempts >= max_attempts:
                continue # locked match
                
            matched_doc = doc
            break

    if not matched_doc:
        # If no valid match, penalize only the latest generated code so they don't break old codes
        if latest_doc:
            record = latest_doc.to_dict()
            attempts = record.get("attempts", 0) + 1
            latest_doc.reference.update({"attempts": attempts})
            attempts_left = max(0, max_attempts - attempts)
            return {"success": False, "message": "Invalid code", "attempts_left": attempts_left}
        return {"success": False, "message": "Invalid code", "attempts_left": 0}

    # Code is absolutely valid - mark as verified
    matched_doc.reference.update({
        "verified": True,
        "verified_at": firestore.SERVER_TIMESTAMP,
    })

    print(f"[verification_service] User {uid} verified email successfully")
    return {"success": True, "message": "Email verified successfully", "attempts_left": 0}


def is_email_verified(uid: str) -> bool:
    """Check if a user has verified their email."""
    db = _get_db()
    try:
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            return user_doc.to_dict().get("email_verified", False)
        return False
    except Exception as e:
        print(f"[verification_service] Error checking verification status: {e}")
        return False


def get_verification_status(uid: str) -> dict:
    """Get the current verification status and attempts left."""
    db = _get_db()
    max_attempts = int(os.getenv("VERIFICATION_MAX_ATTEMPTS", "5"))

    try:
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            return {"email_verified": False, "email": None, "attempts_left": max_attempts}

        user_data = user_doc.to_dict()
        email_verified = user_data.get("email_verified", False)
        email = user_data.get("email")

        # Get latest unverified code for this user
        docs = (
            db.collection("email_verification_codes")
            .where("uid", "==", uid)
            .where("verified", "==", False)
            .get()
        )

        attempts_left = max_attempts
        if docs:
            def get_time(d):
                t = d.to_dict().get("expires_at")
                return t.timestamp() if hasattr(t, "timestamp") else 0
            
            docs.sort(key=get_time, reverse=True)
            record = docs[0].to_dict()
            attempts = record.get("attempts", 0)
            attempts_left = max_attempts - attempts

        return {
            "email_verified": email_verified,
            "email": email,
            "attempts_left": attempts_left,
        }
    except Exception as e:
        print(f"[verification_service] Error getting verification status: {e}")
        return {"email_verified": False, "email": None, "attempts_left": max_attempts}
