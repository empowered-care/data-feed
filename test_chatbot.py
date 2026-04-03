import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_chatbot():
    print("🧪 Testing Powerful Multi-Agent Chatbot...")
    
    # 1. Ask about location (should route to location agent)
    print("\n❓ Query 1: 'Which areas have cases?'")
    resp1 = requests.post(f"{BASE_URL}/outbreak/chat", json={"message": "Which areas have cases?"})
    if resp1.status_code == 200:
        data = resp1.json()
        sid = data["session_id"]
        print(f"🤖 Response (Agent: {data['agent_used']}): {data['response']}")
        
        # 2. Ask about symptoms (should route to infection agent)
        print("\n❓ Query 2: 'What are the symptoms in Hawassa?'")
        resp2 = requests.post(f"{BASE_URL}/outbreak/chat", json={"message": "What are the symptoms in Hawassa?", "session_id": sid})
        data2 = resp2.json()
        print(f"🤖 Response (Agent: {data2['agent_used']}): {data2['response']}")
        
        # 3. Check memory (Ask about the first query)
        print("\n❓ Query 3: 'What did I ask you first?'")
        resp3 = requests.post(f"{BASE_URL}/outbreak/chat", json={"message": "What did I ask you first?", "session_id": sid})
        data3 = resp3.json()
        print(f"🤖 Response (Agent: {data3['agent_used']}): {data3['response']}")
        print(f"📈 History Count: {data3['history_count']}")
        
        # 4. Clear session
        print(f"\n🗑️ Clearing session {sid}...")
        requests.delete(f"{BASE_URL}/outbreak/chat/{sid}")
    else:
        print(f"❌ Failed! Status: {resp1.status_code}, Detail: {resp1.text}")

if __name__ == "__main__":
    test_chatbot()
