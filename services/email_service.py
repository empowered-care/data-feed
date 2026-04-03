import aiosmtplib
from email.message import EmailMessage
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_USE_TLS, FRONTEND_URL
import logging

logger = logging.getLogger(__name__)

async def send_email(to: str, subject: str, content: str):
    """Send an email using aiosmtplib."""
    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(content)

    try:
        if SMTP_USE_TLS:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASSWORD,
                use_tls=False,  # Set to False because we're using STARTTLS (port 587)
                start_tls=True,
            )
        else:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASSWORD,
                use_tls=False,
            )
        logger.info(f"📧 Email sent successfully to {to}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to}: {e}")
        return False

async def send_invitation_email(email: str, token: str):
    """Send an invitation email to a new employee."""
    invite_link = f"{FRONTEND_URL}/register?token={token}"
    subject = "Invitation to Join Aegis Lite"
    content = f"""Welcome to Aegis Lite!

An administrator has invited you to join the Aegis Lite system.
Please click the link below to complete your registration and set your password:

{invite_link}

The link will expire in 48 hours.

If you were not expecting this invitation, please ignore this email."""
    
    return await send_email(email, subject, content)

async def send_reset_password_email(email: str, token: str):
    """Send a password reset email."""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset Your Password - Aegis Lite"
    content = f"""Hello,

You have requested to reset your password for your Aegis Lite account.
Please click the link below to reset your password:

{reset_link}

The link will expire in 1 hour.

If you did not request a password reset, please ignore this email and your password will remain unchanged."""
    
    return await send_email(email, subject, content)
