import json
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from jose import jwt
from config import BASE_DIR, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, INVITE_TOKEN_EXPIRE_HOURS, RESET_TOKEN_EXPIRE_HOURS, SMTP_USER
from utils.security import get_password_hash, verify_password, create_access_token, create_invite_token, create_reset_token, decode_token
from models.schemas import User, UserRole, UserCreate, UserInvite, UserAcceptInvite
from services.email_service import send_invitation_email, send_reset_password_email
import logging

logger = logging.getLogger(__name__)

USERS_FILE = os.path.join(BASE_DIR, "models", "users.json")

class AuthService:
    def __init__(self):
        self._ensure_users_file()
        self.users = self._load_users()

    def _ensure_users_file(self):
        """Create the users.json file if it doesn't exist."""
        if not os.path.exists(os.path.dirname(USERS_FILE)):
            os.makedirs(os.path.dirname(USERS_FILE))
        
        if not os.path.exists(USERS_FILE):
            # Create a default admin user
            admin_email = SMTP_USER or "admin@aegis-lite.com"
            # Default password for admin
            admin_user = {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "hashed_password": get_password_hash("admin123"), # Initial password
                "full_name": "Admin User",
                "role": UserRole.ADMIN,
                "is_active": True,
                "created_at": datetime.now().isoformat()
            }
            with open(USERS_FILE, "w") as f:
                json.dump([admin_user], f, indent=4)
            logger.info(f"✅ Created default admin user: {admin_email}")

    def _load_users(self) -> List[dict]:
        """Load users from the JSON file."""
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"❌ Failed to load users: {e}")
            return []

    def _save_users(self):
        """Save users to the JSON file."""
        try:
            with open(USERS_FILE, "w") as f:
                json.dump(self.users, f, indent=4)
        except Exception as e:
            logger.error(f"❌ Failed to save users: {e}")

    def get_user_by_email(self, email: str) -> Optional[dict]:
        """Find a user by email."""
        for user in self.users:
            if user["email"] == email:
                return user
        return None

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Find a user by ID."""
        for user in self.users:
            if user["id"] == user_id:
                return user
        return None

    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate a user and return the user object."""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user["hashed_password"]):
            return None
        return user

    async def invite_user(self, invite_data: UserInvite, admin_user: dict):
        """Allow admin to invite a new user."""
        if admin_user["role"] != UserRole.ADMIN:
            raise Exception("Only administrators can invite users.")

        # Check if user already exists
        existing_user = self.get_user_by_email(invite_data.email)
        if existing_user:
            raise Exception("A user with this email already exists.")

        # Create invitation token
        token = create_invite_token(
            invite_data.email, 
            invite_data.role, 
            timedelta(hours=INVITE_TOKEN_EXPIRE_HOURS)
        )

        # Send invitation email
        email_sent = await send_invitation_email(invite_data.email, token)
        if not email_sent:
            raise Exception("Failed to send invitation email.")

        return {"message": f"Invitation sent to {invite_data.email}"}

    async def register_user(self, accept_data: UserAcceptInvite):
        """Complete user registration from invitation."""
        payload = decode_token(accept_data.token)
        if not payload or payload.get("type") != "invitation":
            raise Exception("Invalid or expired invitation token.")

        email = payload.get("email")
        role = payload.get("role")

        if not email or not role:
            raise Exception("Invalid token payload.")

        # Check if user already exists (just in case)
        if self.get_user_by_email(email):
            raise Exception("User is already registered.")

        # Create new user
        new_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "hashed_password": get_password_hash(accept_data.password),
            "full_name": accept_data.full_name,
            "role": role,
            "is_active": True,
            "created_at": datetime.now().isoformat()
        }

        self.users.append(new_user)
        self._save_users()

        return {"message": "User registered successfully."}

    async def request_password_reset(self, email: str):
        """Send password reset link to user."""
        user = self.get_user_by_email(email)
        if not user:
            # We don't want to leak if an email exists, but for this app it's probably fine
            return {"message": "If the email exists, a reset link will be sent."}

        token = create_reset_token(email, timedelta(hours=RESET_TOKEN_EXPIRE_HOURS))
        email_sent = await send_reset_password_email(email, token)
        
        if not email_sent:
            raise Exception("Failed to send password reset email.")

        return {"message": "Password reset link sent."}

    async def reset_password(self, token: str, new_password: str):
        """Reset user password using token."""
        payload = decode_token(token)
        if not payload or payload.get("type") != "password_reset":
            raise Exception("Invalid or expired password reset token.")

        email = payload.get("email")
        user = self.get_user_by_email(email)
        if not user:
            raise Exception("User not found.")

        # Update password
        user["hashed_password"] = get_password_hash(new_password)
        self._save_users()

        return {"message": "Password updated successfully."}

    async def change_password(self, user_id: str, old_password: str, new_password: str):
        """Change password for an authenticated user."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise Exception("User not found.")

        if not verify_password(old_password, user["hashed_password"]):
            raise Exception("Incorrect old password.")

        user["hashed_password"] = get_password_hash(new_password)
        self._save_users()

        return {"message": "Password changed successfully."}
