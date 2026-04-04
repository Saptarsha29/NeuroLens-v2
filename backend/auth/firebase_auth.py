import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Initialize Firebase Admin SDK once at module load
# ---------------------------------------------------------------------------
_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
_service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()


def _build_firebase_credential() -> credentials.Base:
    if _service_account_json:
        # Allow multi-line keys passed with escaped newlines via .env
        normalized = _service_account_json.replace("\\n", "\n")
        try:
            service_account_info = json.loads(normalized)
            return credentials.Certificate(service_account_info)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid FIREBASE_SERVICE_ACCOUNT_JSON content") from exc

    if os.path.exists(_cred_path):
        return credentials.Certificate(_cred_path)

    raise RuntimeError(
        "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CREDENTIALS_PATH."
    )

if not firebase_admin._apps:
    cred = _build_firebase_credential()
    firebase_admin.initialize_app(cred)

# ---------------------------------------------------------------------------
# Bearer token extractor
# ---------------------------------------------------------------------------
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    FastAPI dependency — verifies the Firebase ID token sent as
    'Authorization: Bearer <token>' and returns {'uid': ..., 'email': ...}.
    Raises HTTP 401 if the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    try:
        decoded = auth.verify_id_token(credentials.credentials)
        return {"uid": decoded["uid"], "email": decoded.get("email", "")}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict | None:
    """
    Same as get_current_user but returns None instead of raising if
    no token is provided. Used for endpoints that work for guests too
    (e.g. /calculate_final_score — guests can get a score but it won't
    be saved to Firestore).
    """
    if credentials is None:
        return None

    try:
        decoded = auth.verify_id_token(credentials.credentials)
        return {"uid": decoded["uid"], "email": decoded.get("email", "")}
    except Exception:
        return None


def get_verified_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    Verify Firebase token AND check that email is verified in Firestore.
    Raises HTTP 403 if email is not verified.
    Returns {'uid': ..., 'email': ...} if both checks pass.
    """
    # First verify the token
    current_user = get_current_user(credentials)

    # Then check email verification status in Firestore
    from services import firestore_service
    user_profile = firestore_service.get_user(current_user["uid"])

    if not user_profile or not user_profile.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    return current_user

