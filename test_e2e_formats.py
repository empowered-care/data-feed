import requests
import os
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_upload(file_path, content_type):
    print(f"\n🚀 Testing file upload: {file_path} ({content_type})")
    
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, content_type)}
        try:
            response = requests.post(f"{BASE_URL}/outbreak/upload", files=files, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Session ID: {data['session_id']}")
                print(f"   Extracted Location: {data['extracted_data']['location']}")
                print(f"   Consensus Risk: {data['consensus']['final_risk_level']}")
                print(f"   Confidence: {data['consensus']['average_confidence']}%")
                print(f"   Alert Title: {data['alert']['title']}")
            else:
                print(f"❌ Failed! Status: {response.status_code}")
                print(f"   Detail: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")

def run_all_tests():
    test_data = [
        ("test_data/outbreak_test.csv", "text/csv"),
        ("test_data/outbreak_test.pdf", "application/pdf"),
        ("test_data/outbreak_test.jpg", "image/jpeg"),
        ("test_data/outbreak_test.txt", "text/plain")
    ]
    
    for file_path, content_type in test_data:
        if os.path.exists(file_path):
            test_upload(file_path, content_type)
            time.sleep(2)
        else:
            print(f"⚠️ Skipping missing file: {file_path}")

if __name__ == "__main__":
    print("🌟 Starting End-to-End Format Testing Suite")
    print("=" * 50)
    
    # Check if server is running
    try:
        requests.get(BASE_URL, timeout=5)
        run_all_tests()
    except requests.exceptions.ConnectionError:
        print("❌ Server is NOT running! Please start aegis_main.py first.")
    
    print("\n" + "=" * 50)
    print("✨ End-to-End Tests Complete!")
