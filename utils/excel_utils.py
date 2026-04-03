import pandas as pd
import json
from typing import List, Dict, Any
from models.schemas import StructuredMedicalRecord, Medication

def parse_excel_or_csv(file_content: bytes, filename: str) -> List[StructuredMedicalRecord]:
    """
    Parses a CSV or XLSX file and converts each row into a StructuredMedicalRecord
    """
    if filename.endswith(".csv"):
        df = pd.read_csv(pd.io.common.BytesIO(file_content))
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(pd.io.common.BytesIO(file_content))
    else:
        raise ValueError("Unsupported file format. Please upload CSV or XLSX.")

    # Standardize column names (case-insensitive and trimming)
    df.columns = [col.lower().strip().replace(" ", "_") for col in df.columns]

    records: List[StructuredMedicalRecord] = []
    
    for _, row in df.iterrows():
        # Parsing diagnosis and medications which might be stored as strings in Excel
        diagnosis = row.get("diagnosis", [])
        if isinstance(diagnosis, str):
            diagnosis = [d.strip() for d in diagnosis.split(",")]
        elif pd.isna(diagnosis):
            diagnosis = []

        # Parse medications (expected format: "Paracetamol 500mg 1x3, Amoxicillin 1g 1x2")
        medications = []
        med_raw = row.get("medications", "")
        if isinstance(med_raw, str) and med_raw.strip():
            med_list = med_raw.split(",")
            for med in med_list:
                parts = med.strip().split(" ")
                if len(parts) >= 3:
                   medications.append(Medication(
                       name=parts[0], 
                       dosage=parts[1], 
                       frequency=parts[2]
                    ))
                else:
                   medications.append(Medication(name=med.strip(), dosage="", frequency=""))

        # Create Pydantic record
        record = StructuredMedicalRecord(
            document_type=str(row.get("document_type", "Excel Import")),
            patient_name=str(row.get("patient_name", "Unknown")),
            patient_id=str(row.get("patient_id", "")),
            date_of_birth=str(row.get("date_of_birth", "")),
            gender=str(row.get("gender", "")),
            visit_date=str(row.get("visit_date", "")),
            referred_from=str(row.get("referred_from", "")),
            referred_to=str(row.get("referred_to", "")),
            diagnosis=diagnosis,
            symptoms=[], # Spreadsheet can expand later
            investigations=[],
            medications=medications,
            allergies=[],
            notes=str(row.get("notes", "")),
            additional_info={},
            confidence=1.0
        )
        records.append(record)

    return records
