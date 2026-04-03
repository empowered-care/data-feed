import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

def run_all_tests():
    print("🚀 Starting All-Inclusive Aegis Lite Test Suite")
    print("=" * 60)

    # 1. Login to get token
    print("\n🔐 1. Admin Login...")
    login_data = {
        "username": "masrialemuwork@gmail.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✅ Login successful!")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Outbreak Process
    print("\n🚨 2. Testing Outbreak Processing...")
    report = "Fever, vomiting, 4 people affected in Jimma"
    response = requests.post(f"{BASE_URL}/outbreak/process", json={"text": report}, headers=headers)
    if response.status_code == 200:
        print(f"✅ Success! Risk level: {response.json()['risk_analysis']['risk_level']}")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")

    # 3. Test Outbreak Query
    print("\n🔍 3. Testing Data Assistant Query...")
    query = "What locations have reports?"
    response = requests.post(f"{BASE_URL}/outbreak/query", json={"query": query}, headers=headers)
    if response.status_code == 200:
        print(f"✅ Success! Response snippet: {response.json()['response'][:100]}...")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")

    # 4. Test Summary
    print("\n📊 4. Testing Summary Endpoint...")
    response = requests.get(f"{BASE_URL}/outbreak/summary", headers=headers)
    if response.status_code == 200:
        print(f"✅ Success! Total reports: {response.json()['total_reports']}")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")

    # 5. Test Chatbot
    print("\n💬 5. Testing Multi-Agent Chatbot...")
    chat_payload = {"message": "How many cases in Jimma?", "session_id": "test-session"}
    response = requests.post(f"{BASE_URL}/outbreak/chat", json=chat_payload, headers=headers)
    if response.status_code == 200:
        print(f"✅ Success! Chatbot: {response.json()['response'][:100]}...")
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")

    # 6. Test File Upload (Minimal)
    print("\n📁 6. Testing File Upload (outbreak_test.csv)...")
    file_path = "test_data/outbreak_test.csv"
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "text/csv")}
            response = requests.post(f"{BASE_URL}/outbreak/upload", files=files, headers=headers)
            if response.status_code == 200:
                print(f"✅ Success! Extracted: {response.json()['extracted_data']['location']}")
            else:
                print(f"❌ Failed: {response.status_code} - {response.text}")
    else:
        print(f"⚠️ File {file_path} not found. Skipping.")

    print("\n" + "=" * 60)
    print("✨ All-Inclusive Test Suite Complete!")

if __name__ == "__main__":
    run_all_tests()
