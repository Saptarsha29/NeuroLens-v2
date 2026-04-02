from pydantic import BaseModel, EmailStr, Field


class SendVerificationCodeRequest(BaseModel):
    """Request to send verification code."""
    email: EmailStr


class VerifyEmailCodeRequest(BaseModel):
    """Request to verify email code."""
    code: str = Field(..., min_length=6, max_length=6, pattern="^\d{6}$")


class VerificationStatusResponse(BaseModel):
    """Response for verification status."""
    success: bool
    email_verified: bool
    email: str | None
    attempts_left: int | None = None
