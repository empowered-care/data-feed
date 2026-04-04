import pandas as pd
import random
from datetime import datetime, timedelta

# List of Ethiopian locations for realism
ETHIOPIAN_LOCATIONS = [
    "Addis Ababa", "Gondar", "Mekelle", "Bahir Dar", "Hawassa", 
    "Adama", "Jimma", "Dire Dawa", "Dessie", "Jijiga", "Shashamane",
    "Arba Minch", "Hosaena", "Dila", "Nekemte", "Debre Markos"
]

SYMPTOMS_POOL = [
    "fever", "cough", "headache", "vomiting", "diarrhea",
    "rash", "fatigue", "nausea", "chills", "muscle pain", "joint pain"
]

def generate_mock_data(num_rows=25):
    data = []
    
    for i in range(num_rows):
        # 1. Location (sometimes messy/fragmented)
        loc = random.choice(ETHIOPIAN_LOCATIONS)
        if random.random() < 0.2: # 20% chance of fragmented name
            loc = loc.split()[0] if " " in loc else loc[:4]
            
        # 2. Symptoms (sometimes as a string, sometimes a list)
        symptoms = random.sample(SYMPTOMS_POOL, random.randint(1, 4))
        if random.random() < 0.3:
            symptoms_str = ", ".join(symptoms)
        else:
            symptoms_str = str(symptoms) # Keep it messy like raw data
            
        # 3. Cases (sometimes invalid or string based)
        cases = random.randint(1, 50)
        if random.random() < 0.15:
            cases = f"approx {cases}" # Fragmented non-numeric
            
        # 4. Date (sometimes missing)
        date = None
        if random.random() > 0.2:
            base_date = datetime(2026, 3, 1)
            date = (base_date + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
            
        # 5. Additional Info (Optional/Messy)
        info = random.choice([
            "Reported by local clinic",
            "Urgent attention needed",
            "Follow-up required",
            "Confirmed via phone call",
            "N/A",
            "",
            "Cluster of cases in market area"
        ])

        data.append({
            "location": loc,
            "symptoms": symptoms_str,
            "cases": cases,
            "date": date,
            "additional_info": info
        })
        
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_mock_data(30)
    file_path = "test_data/ethiopia_outbreak_raw.csv"
    
    # Ensure directory exists
    import os
    os.makedirs("test_data", exist_ok=True)
    
    df.to_csv(file_path, index=False)
    print(f"✅ Fragmented Ethiopia mock data generated: {file_path}")
    print("\nSample Data:")
    print(df.head())
