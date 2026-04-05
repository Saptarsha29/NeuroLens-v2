from fastapi import APIRouter, Depends, HTTPException, status
from schemas.email_models import SendVerificationCodeRequest, VerifyEmailCodeRequest, VerificationStatusResponse
from services import firestore_service, verification_service, email_service
from auth.firebase_auth import get_current_user

router = APIRouter()


@router.post("/send_verification_code")
async def send_verification_code(
    body: SendVerificationCodeRequest,
    user: dict = Depends(get_current_user),
):
    """
    Send a verification code to the user's email.
    Requires authentication.
    """
    try:
        # Create user profile if it doesn't exist
        firestore_service.create_or_update_user(
            uid=user["uid"],
            email=body.email,
            name=user.get("display_name", "User"),
        )

        # Generate and store verification code
        code = verification_service.create_verification_record(
            uid=user["uid"],
            email=body.email,
        )

        # Send email
        success = email_service.send_verification_email(
            email=body.email,
            code=code,
            user_name=user.get("display_name", "User"),
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email",
            )

        return {
            "success": True,
            "message": "Verification code sent to your email",
            "email": body.email,
            "expires_in_seconds": 600,  # 10 minutes
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[auth.send_verification_code] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code",
        )


@router.post("/verify_email_code")
async def verify_email_code(
    body: VerifyEmailCodeRequest,
    user: dict = Depends(get_current_user),
):
    """
    Verify the email code and mark user as verified.
    Requires authentication.
    """
    try:
        result = verification_service.verify_code(
            uid=user["uid"],
            code=body.code,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"],
            )

        # Mark user as verified in Firestore
        firestore_service.update_email_verified(user["uid"])

        return {
            "success": True,
            "message": "Email verified successfully",
            "email_verified": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[auth.verify_email_code] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify email code",
        )


@router.get("/verification_status")
async def verification_status(
    user: dict = Depends(get_current_user),
):
    """
    Get the current verification status and attempts left.
    Requires authentication.
    """
    try:
        status_data = verification_service.get_verification_status(user["uid"])

        return {
            "success": True,
            "email_verified": status_data["email_verified"],
            "email": status_data["email"],
            "attempts_left": status_data["attempts_left"],
        }

    except Exception as e:
        print(f"[auth.verification_status] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get verification status",
        )

@router.post("/record_login")
async def record_login(
    user: dict = Depends(get_current_user),
):
    """
    Record that the user just logged in manually.
    If it has been > 90 days since their last login, revoke verification status.
    """
    try:
        force_verify = firestore_service.record_manual_login(user["uid"])
        return {
            "success": True,
            "forced_re_verification": force_verify
        }
    except Exception as e:
        print(f"[auth.record_login] Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record login",
        )
