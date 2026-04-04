import pandas as pd
import httpx
import asyncio
import json
import os

BASE_URL = "http://localhost:8000"
CSV_PATH = "test_data/ethiopia_outbreak_raw.csv"

# Credentials for the newly created dev admin
ADMIN_EMAIL = "masri_dev@aegis.com"
ADMIN_PWD = "AegisDeveloper2026!"

async def ingest_data():
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV not found at {CSV_PATH}")
        return

    print(f"📖 Reading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    async with httpx.AsyncClient() as client:
        # 1. Login to get token
        print(f"🔐 Logging in as {ADMIN_EMAIL}...")
        login_resp = await client.post(
            f"{BASE_URL}/auth/login",
            data={"username": ADMIN_EMAIL, "password": ADMIN_PWD}
        )
        
        if login_resp.status_code != 200:
            print(f"❌ Login failed: {login_resp.text}")
            return
            
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Ingest rows
        print(f"🚀 Ingesting {len(df)} reports into Empowered Care...")
        success_count = 0
        
        for _, row in df.iterrows():
            # Construct a natural language report for the agent to extract
            text = f"Outbreak Report: In {row['location']}, we have {row['cases']} cases showing symptoms of {row['symptoms']}. Date: {row['date']}. Notes: {row['additional_info']}"
            
            try:
                resp = await client.post(
                    f"{BASE_URL}/outbreak/process",
                    json={"text": text},
                    headers=headers,
                    timeout=30.0
                )
                if resp.status_code == 200:
                    success_count += 1
                    print(f"✅ Ingested report for {row['location']}")
                else:
                    print(f"⚠️ Failed to ingest row: {resp.text}")
            except Exception as e:
                print(f"❌ Error during ingestion: {e}")

        print(f"\n✨ Ingestion Complete! {success_count}/{len(df)} reports are now in the system.")
        print("🤖 You can now ask the AI Assistant about 'Addis Ababa', 'Mekelle', or general trends.")

if __name__ == "__main__":
    asyncio.run(ingest_data())
