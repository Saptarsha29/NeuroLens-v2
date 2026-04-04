from datetime import datetime, timezone
from firebase_admin import firestore

_db = firestore.client


def _get_db():
    """Lazy Firestore client — ensures Firebase Admin is initialized first."""
    return firestore.client()


def create_or_update_user(uid: str, email: str, name: str) -> None:
    """
    Create or update a user profile in Firestore.
    Called after registration to store user metadata.
    """
    db = _get_db()
    db.collection("users").document(uid).set(
        {
            "email": email,
            "name": name,
            "email_verified": False,
            "created_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    print(f"[firestore_service] Created/updated user profile for {uid}")


def get_user(uid: str) -> dict | None:
    """Retrieve user profile from Firestore."""
    db = _get_db()
    try:
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"[firestore_service] Error getting user: {e}")
        return None


def update_email_verified(uid: str) -> None:
    """Mark a user's email as verified."""
    db = _get_db()
    try:
        db.collection("users").document(uid).update({
            "email_verified": True,
        })
        print(f"[firestore_service] Marked email as verified for {uid}")
    except Exception as e:
        print(f"[firestore_service] Error updating verification status: {e}")


def save_test_result(uid: str, voice: float, spiral: float, tap: float, final: float) -> str:
    """
    Write a new test result document to Firestore.
    Returns the new document ID.
    """
    db = _get_db()
    doc_ref = db.collection("test_results").document()
    doc_ref.set(
        {
            "user_id": uid,
            "voice_score": round(voice, 2),
            "spiral_score": round(spiral, 2),
            "tap_score": round(tap, 2),
            "final_score": round(final, 2),
            "created_at": firestore.SERVER_TIMESTAMP,
        }
    )
    return doc_ref.id


def get_user_history(uid: str) -> list[dict]:
    """
    Return all test results for a user, newest first.
    Firestore requires a composite index on (user_id ASC, created_at DESC).
    The index will be auto-created on first query or via console.
    """
    db = _get_db()
    docs = (
        db.collection("test_results")
        .where("user_id", "==", uid)
        .get()
    )
    
    # Sort in memory to bypass the requirement for a Cloud Composite Index 
    def get_sort_time(doc):
        t = doc.to_dict().get("created_at")
        if t and hasattr(t, "timestamp"):
            return t.timestamp()
        return doc.create_time.timestamp() if doc.create_time else 0
        
    docs = sorted(docs, key=get_sort_time, reverse=True)
    results = []
    for doc in docs:
        data = doc.to_dict()
        ts = data.get("created_at")

        # Firestore Timestamps come back as datetime objects after .get()
        if hasattr(ts, "strftime"):
            created_dt = ts
        elif ts is not None:
            created_dt = ts.astimezone(timezone.utc)
        else:
            created_dt = datetime.now(timezone.utc)

        results.append(
            {
                "id": doc.id,
                "user_id": data.get("user_id"),
                "voice_score": data.get("voice_score"),
                "spiral_score": data.get("spiral_score"),
                "tap_score": data.get("tap_score"),
                "final_score": data.get("final_score"),
                "created_at": created_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "created_at_iso": created_dt.isoformat(),
                "date": created_dt.strftime("%Y-%m-%d"),
                "time": created_dt.strftime("%H:%M:%S"),
            }
        )
    return results


def get_weekly_averages(uid: str) -> dict:
    """
    Group test results by ISO week and return average final scores.
    Ported from d:/NeuroLens/app.py lines 618-650.
    """
    all_results = get_user_history(uid)

    if not all_results:
        return {"weeks": [], "scores": []}

    weekly_groups: dict = {}
    for result in reversed(all_results):  # ascending order for grouping
        dt = datetime.strptime(result["created_at"], "%Y-%m-%d %H:%M:%S")
        week_key = dt.strftime("%Y-W%W")
        week_display = dt.strftime("Week %W, %Y")

        if week_key not in weekly_groups:
            weekly_groups[week_key] = {"display": week_display, "scores": []}
        weekly_groups[week_key]["scores"].append(result["final_score"])

    weeks = []
    scores = []
    for week_key in sorted(weekly_groups):
        group = weekly_groups[week_key]
        avg = sum(group["scores"]) / len(group["scores"])
        weeks.append(group["display"])
        scores.append(round(avg, 2))

    return {"weeks": weeks, "scores": scores}
