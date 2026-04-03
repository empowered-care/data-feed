import re
from typing import Optional, List
from models.schemas import StructuredMedicalRecord, Medication

class Structurer:
    @staticmethod
    def _extract(pattern: str, text: str, group: int = 1) -> Optional[str]:
        match = re.search(pattern, text, re.I)
        return match.group(group).strip() if match else None

    @staticmethod

    def structure(raw_text: str, avg_conf: float) -> StructuredMedicalRecord:
        # Improved Extraction for Referral Forms
        patient_name = (Structurer._extract(r"(?:NAME|Patient Name)[:\s]+([A-Za-z\s]+)", raw_text) or 
                        Structurer._extract(r"NAME\s+([A-Z\s]+)", raw_text) or "Unknown")
        
        patient_id = Structurer._extract(r"(?:ID|MRN)[:\s]+([A-Za-z0-9-]+)", raw_text)
        dob = Structurer._extract(r"(?:DOB|AGE)[:\s]+([\d/-]+)", raw_text)
        gender = Structurer._extract(r"(?:Gender|SEX)[:\s]+(Male|Female|M|F)", raw_text)
        visit_date = Structurer._extract(r"Date[:\s]+([\d/-]+)", raw_text)
        
        # Clinical Content with flexible labels
        diagnosis = re.findall(r"(?:Diagnosis|Dx|Tentative Diagnosis)[:\s]+([^\n]+)", raw_text, re.I)
        allergies = re.findall(r"Allerg[yies]+[:\s]+([^\n]+)", raw_text, re.I)
        history = Structurer._extract(r"(?:Patient History|P/H)[:\s]+(.*?)(?=\n[A-Z/]|IX|P/E|$)", raw_text)
        ix = re.findall(r"(?:Investigations?|I/X|IX)[:\s]+([^\n]+)", raw_text, re.I)
        reason = Structurer._extract(r"Reason for referal[:\s]+(.*?)(?=\n[A-Z]|$)", raw_text)

        # Merge extracted text into notes
        clinical_notes = f"HISTORY: {history}\nIX: {', '.join(ix)}\nREASON: {reason}\n\nRAW:\n{raw_text[:2000]}"
        
        # Process Medications
        medications: List[Medication] = []
        med_matches = re.finditer(r"Medication(?:s)?[:\s]+(.*?)(?=\n[A-Z]|$)", raw_text, re.S | re.I)
        for match in med_matches:
            lines = match.group(1).split("\n")
            for line in lines:
                m = re.search(r"([A-Za-z\s]+?)\s+(\d+(?:mg|ml|mcg|u|g))\s+([0-9a-z/]+)", line, re.I)
                if m:
                    medications.append(Medication(
                        name=m.group(1).strip(),
                        dosage=m.group(2).strip(),
                        frequency=m.group(3).strip()
                    ))
        
        return StructuredMedicalRecord(
            patient_name=patient_name.strip(),
            patient_id=patient_id,
            date_of_birth=dob,
            gender=gender,
            visit_date=visit_date,
            diagnosis=[d.strip() for d in diagnosis],
            medications=medications,
            allergies=[a.strip() for a in allergies],
            notes=clinical_notes.strip(),
            confidence=round(avg_conf, 3)
        )