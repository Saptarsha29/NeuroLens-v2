from fastapi import APIRouter, Depends, HTTPException

from schemas.models import FinalScoreRequest
from services import firestore_service
from auth.firebase_auth import get_current_user, get_optional_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Final score calculation
# ---------------------------------------------------------------------------

@router.post("/calculate_final_score")
async def calculate_final_score(
    body: FinalScoreRequest,
    user: dict | None = Depends(get_optional_user),
):
    """
    Combine the three sub-scores into a single Neurological Wellness Score.
    Formula: 0.4 * voice + 0.4 * spiral + 0.2 * tap  (same as original app.py:443)
    If the user is authenticated the result is persisted to Firestore.
    Guests receive the score but it is not saved.
    """
    final = (0.4 * body.voice_score) + (0.4 * body.spiral_score) + (0.2 * body.tap_score)
    final = round(final, 2)

    if final >= 80:
        status = "Healthy"
        status_color = "green"
    elif final >= 60:
        status = "Monitor"
        status_color = "orange"
    else:
        status = "Possible Risk"
        status_color = "red"

    # Persist for authenticated users
    if user is not None:
        try:
            firestore_service.save_test_result(
                uid=user["uid"],
                voice=body.voice_score,
                spiral=body.spiral_score,
                tap=body.tap_score,
                final=final,
            )
        except Exception as e:
            # Non-fatal: return the score even if save fails
            print(f"[scores] Firestore save error: {e}")

    return {
        "success": True,
        "voice_score": round(body.voice_score, 2),
        "spiral_score": round(body.spiral_score, 2),
        "tap_score": round(body.tap_score, 2),
        "final_score": final,
        "status": status,
        "status_color": status_color,
    }


# ---------------------------------------------------------------------------
# History (auth required)
# ---------------------------------------------------------------------------

@router.get("/history")
async def get_history(user: dict = Depends(get_current_user)):
    """Return all test results for the authenticated user, newest first."""
    try:
        results = firestore_service.get_user_history(user["uid"])
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Weekly averages (auth required)
# ---------------------------------------------------------------------------

@router.get("/weekly_data")
async def get_weekly_data(user: dict = Depends(get_current_user)):
    """Return weekly-averaged final scores for the authenticated user."""
    try:
        data = firestore_service.get_weekly_averages(user["uid"])
        return {"success": True, **data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
