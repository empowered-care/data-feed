#!/usr/bin/env python3
"""
Test script for Aegis Lite Outbreak Detection System
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_outbreak_processing():
    """Test the main outbreak processing endpoint."""
    print("🧪 Testing Outbreak Processing...")

    test_reports = [
        "Fever, vomiting, 4 people affected in Jimma",
        "Diarrhea and abdominal pain, 2 cases in Addis Ababa",
        "High fever and rash, 10 people in Hawassa"
    ]

    for i, report in enumerate(test_reports, 1):
        print(f"\n📝 Test Report {i}: {report}")

        try:
            response = requests.post(
                f"{BASE_URL}/outbreak/process",
                json={"text": report},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                print("✅ Processing successful!")
                print(f"   Location: {data['extracted_data']['location']}")
                print(f"   Symptoms: {', '.join(data['extracted_data']['symptoms'])}")
                print(f"   Cases: {data['extracted_data']['cases']}")
                print(f"   Risk Level: {data['risk_analysis']['risk_level']}")
                print(f"   Alert: {data['alert']['title']}")
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")

        time.sleep(2)  # Brief pause between requests

def test_data_query():
    """Test the data assistant query endpoint."""
    print("\n🧪 Testing Data Query...")

    queries = [
        "What locations have reports?",
        "Summary of outbreak data",
        "How many total cases reported?"
    ]

    for query in queries:
        print(f"\n❓ Query: {query}")

        try:
            response = requests.post(
                f"{BASE_URL}/outbreak/query",
                json={"query": query},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                print("✅ Query successful!")
                print(f"   Response: {data['response'][:100]}...")
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")

        time.sleep(1)

def test_summary():
    """Test the summary endpoint."""
    print("\n🧪 Testing Summary Endpoint...")

    try:
        response = requests.get(f"{BASE_URL}/outbreak/summary", timeout=10)

        if response.status_code == 200:
            data = response.json()
            print("✅ Summary retrieved!")
            print(f"   Total Reports: {data['total_reports']}")
            print(f"   Locations: {data['locations']}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Aegis Lite Test Suite")
    print("=" * 50)

    # Test endpoints
    test_outbreak_processing()
    test_data_query()
    test_summary()

    print("\n" + "=" * 50)
    print("✨ Test Suite Complete!")