import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Explicitly load from backend/.env just in case it's run from another dir
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path, override=True)


def send_verification_email(email: str, code: str, user_name: str = "User") -> bool:
    """
    Send a verification code email via Gmail SMTP.
    Returns True if successful, False otherwise.
    """
    try:
        sender_email = os.getenv("GMAIL_SENDER_EMAIL")
        sender_password = os.getenv("GMAIL_SENDER_PASSWORD")
        smtp_server = os.getenv("GMAIL_SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("GMAIL_SMTP_PORT", "587"))

        if not sender_email or not sender_password:
            print("[email_service] Missing Gmail credentials in .env")
            return False

        # Create message
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = "NeuroLens - Email Verification Code"

        # Email body
        body = f"""
Hello {user_name},

Your NeuroLens email verification code is:

{code}

This code expires in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
The NeuroLens Team
        """

        message.attach(MIMEText(body, "plain"))

        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(message)

        print(f"[email_service] Verification email sent to {email}")
        return True

    except Exception as e:
        print(f"[email_service] Error sending email: {e}")
        return False
