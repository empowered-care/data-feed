import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    """Test the entire authentication flow: login, invite, register, reset password."""
    print("🧪 Testing Authentication & User Management...")

    # 1. Login as default admin
    print("\n🔐 1. Testing Admin Login...")
    login_data = {
        "username": "masrialemuwork@gmail.com",
        "password": "admin123"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            admin_token = token_data["access_token"]
            print(f"✅ Admin Login Successful! Token starts with: {admin_token[:10]}...")
        else:
            print(f"❌ Admin Login Failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Admin Login Error: {e}")
        return

    # 2. Get Admin Info
    print("\n👤 2. Testing /auth/me (Admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if response.status_code == 200:
        print(f"✅ Get Me Successful: {response.json()['email']} ({response.json()['role']})")
    else:
        print(f"❌ Get Me Failed: {response.status_code}")

    # 3. Admin Invites a New User
    print("\n📧 3. Testing Admin Invitation...")
    invite_payload = {
        "email": "new_employee@example.com",
        "role": "vw"
    }
    response = requests.post(f"{BASE_URL}/admin/invite", json=invite_payload, headers=headers)
    if response.status_code == 200:
        print(f"✅ Invitation Sent: {response.json()['message']}")
        print("💡 Note: In a real test, you'd check your email. For this script, we'll check users.json or the logs.")
    else:
        print(f"❌ Invitation Failed: {response.status_code} - {response.text}")

    # 4. Forgot Password Request
    print("\n🔑 4. Testing Forgot Password Request...")
    reset_payload = {"email": "masrialemuwork@gmail.com"}
    response = requests.post(f"{BASE_URL}/auth/forgot-password", json=reset_payload)
    if response.status_code == 200:
        print(f"✅ Reset Email Sent: {response.json()['message']}")
    else:
        print(f"❌ Forgot Password Failed: {response.status_code} - {response.text}")

    # 5. Test Change Password (Authenticated)
    print("\n🔄 5. Testing Change Password (Authenticated)...")
    change_payload = {
        "old_password": "admin123",
        "new_password": "new_admin_password123"
    }
    response = requests.post(f"{BASE_URL}/auth/change-password", json=change_payload, headers=headers)
    if response.status_code == 200:
        print(f"✅ Password Changed Successfully!")
        # Reset back for subsequent tests
        requests.post(
            f"{BASE_URL}/auth/change-password", 
            json={"old_password": "new_admin_password123", "new_password": "admin123"},
            headers=headers
        )
    else:
        print(f"❌ Change Password Failed: {response.status_code} - {response.text}")

    print("\n✨ Authentication Flow Test Complete!")

if __name__ == "__main__":
    # Ensure the server is running before executing this
    print("🚀 Ensure 'python aegis_main.py' is running in another terminal.")
    time.sleep(2)
    test_auth_flow()
