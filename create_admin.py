import asyncio
import sys
import os
import json
import uuid
from datetime import datetime

# Add current directory to path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.auth_service import AuthService
from utils.security import get_password_hash, verify_password
from models.schemas import UserRole

async def create_admin_user(email, password, full_name="System Administrator"):
    auth_service = AuthService()
    
    # Check if user already exists
    existing_user = auth_service.get_user_by_email(email)
    if existing_user:
        print(f"⚠️ User with email {email} already exists.")
        # Update to admin if not already
        if existing_user["role"] != UserRole.ADMIN:
            print(f"🔄 Updating existing user {email} to ADMIN role.")
            existing_user["role"] = UserRole.ADMIN
            auth_service._save_users()
        return existing_user

    # Create new admin user object
    new_admin = {
        "id": str(uuid.uuid4()),
        "email": email,
        "hashed_password": get_password_hash(password),
        "full_name": full_name,
        "role": UserRole.ADMIN,
        "is_active": True,
        "created_at": datetime.now().isoformat()
    }

    # Add to users list and save
    auth_service.users.append(new_admin)
    auth_service._save_users()
    
    print(f"✅ Successfully created ADMIN user: {email}")
    return new_admin

async def verify_admin_user(email, password):
    auth_service = AuthService()
    print(f"🔍 Verifying credentials for {email}...")
    
    user = await auth_service.authenticate_user(email, password)
    
    if user:
        print(f"✨ Verification successful!")
        print(f"👤 Name: {user.get('full_name')}")
        print(f"🔑 Role: {user.get('role')}")
        print(f"✅ User is ACTIVE and authenticated.")
        return True
    else:
        print(f"❌ Verification FAILED. Incorrect email or password.")
        return False

async def main():
    # Creating a new specific admin for the user to ensure fresh credentials
    admin_email = "masri_dev@aegis.com"
    admin_password = "AegisDeveloper2026!"
    admin_name = "Masri Developer"
    
    print("--- Empowered Care Admin Creation Tool ---")
    
    # 1. Create the admin
    await create_admin_user(admin_email, admin_password, admin_name)
    
    # 2. Verify the admin
    success = await verify_admin_user(admin_email, admin_password)
    
    if success:
        print("\n🚀 Admin setup is complete and verified.")
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        
        # 3. Double Check Authentication via HTTP (if server is running)
        import httpx
        try:
            print(f"🌐 Testing HTTP login against localhost:8000...")
            async with httpx.AsyncClient() as client:
                data = {
                    "username": admin_email,
                    "password": admin_password
                }
                response = await client.post(
                    "http://localhost:8000/auth/login", 
                    data=data,
                    timeout=5.0
                )
                if response.status_code == 200:
                    print("✅ HTTP Login Test: SUCCESS (Status 200)")
                    print(f"🎫 Token received: {response.json().get('access_token')[:10]}...")
                else:
                    print(f"❌ HTTP Login Test: FAILED (Status {response.status_code})")
                    print(f"📝 Response: {response.text}")
        except Exception as e:
            print(f"⚠️ Could not test HTTP login (is server running?): {e}")
    else:
        print("\n⚠️ Admin setup failed internal verification.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
