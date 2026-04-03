import pandas as pd
from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont
import os

# Create directory for test data if not exists
os.makedirs("test_data", exist_ok=True)

def generate_medical_record_text(name, sex, age, city, subcity, woreda, mrn, occupation, date, complaint, history, physical, assessment, pmh, plan):
    return f"""patient name: {name}
sex: {sex}
age: {age}
City: {city}
Subcity: {subcity}
Woreda: {woreda}
MRN: {mrn}
Occupation: {occupation}
Date: {date}

Chief complaint: {complaint}
History: {history}
Physical exam: {physical}
Assessment: {assessment}

Past medical hisotry: {pmh}

Plan: {plan}"""

# 1. Create Messy CSV
def create_csv():
    records = [
        generate_medical_record_text("Abebe Kebede", "Male", "45", "Addis Ababa", "Bole", "03", "MRN-12345", "Teacher", "2026-04-03", "Persistent cough and fever", "Patient has been feeling unwell for 5 days...", "T: 38.5C, BP: 120/80, HR: 88", "Suspected Respiratory Infection", "None", "Chest X-ray and antibiotics"),
        generate_medical_record_text("Fatuma Mohammed", "Female", "28", "Jimma", "Jimma Town", "01", "MRN-67890", "Merchant", "2026-04-03", "Vomiting and nausea", "Symptoms started after eating at a local market...", "T: 37.2C, BP: 110/70, HR: 95, Signs of dehydration", "Acute Gastroenteritis", "None", "IV fluids and rest")
    ]
    data = {
        "Patient ID": ["P001", "P002"],
        "Medical Record": records,
        "Source": ["Clinic A", "Clinic B"]
    }
    df = pd.DataFrame(data)
    df.to_csv("test_data/outbreak_test.csv", index=False)
    print("✅ Messy CSV created at test_data/outbreak_test.csv")

# 2. Create Messy PDF
def create_pdf():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)
    
    content = generate_medical_record_text(
        "Chala Bekele", "Male", "32", "Hawassa", "Tabor", "05", "MRN-11223", "Farmer", "2026-04-03",
        "High fever and skin rash", "Developed rash on face then spreading to body...",
        "T: 39.8C, HR: 110, BP: 115/75. Maculopapular rash noted.", "Suspected Measles",
        "Had similar symptoms in childhood but not vaccinated.", "Isolation and supportive care"
    )
    
    pdf.multi_cell(0, 10, txt=content)
    pdf.output("test_data/outbreak_test.pdf")
    print("✅ Messy PDF created at test_data/outbreak_test.pdf")

# 3. Create Messy Image
def create_image():
    img = Image.new('RGB', (800, 800), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    
    content = generate_medical_record_text(
        "Aster Molla", "Female", "50", "Gondar", "Arada", "02", "MRN-44556", "Housewife", "2026-04-03",
        "Severe headache and dizziness", "Has been experiencing these symptoms for 2 days...",
        "T: 37.0C, BP: 160/100, HR: 72", "Hypertension", "Diagnosed 2 years ago, not compliant with meds.",
        "Start anti-hypertensives and follow up."
    )
    
    y = 50
    for line in content.split('\n'):
        d.text((50, y), line, fill=(0, 0, 0))
        y += 25
    
    img.save("test_data/outbreak_test.jpg")
    print("✅ Messy Image created at test_data/outbreak_test.jpg")

# 4. Create Messy TXT
def create_txt():
    content = generate_medical_record_text(
        "Mulugeta Tadesse", "Male", "10", "Bahir Dar", "Zenzelma", "04", "MRN-77889", "Student", "2026-04-03",
        "Abdominal pain and diarrhea", "Started this morning after drinking from the river...",
        "T: 38.0C, HR: 105, BP: 90/60. Abdomen tender.", "Suspected Waterborne Disease", "None",
        "Stool sample and rehydration."
    )
    with open("test_data/outbreak_test.txt", "w") as f:
        f.write(content.strip())
    print("✅ Messy TXT created at test_data/outbreak_test.txt")

if __name__ == "__main__":
    create_csv()
    create_pdf()
    create_image()
    create_txt()

