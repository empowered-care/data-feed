from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Medication(BaseModel):
    name: str = "string"
    dosage: str = "string"
    frequency: str = "string"

class StructuredMedicalRecord(BaseModel):
    document_type: str = "Medical Record"
    patient_name: str = "string"
    patient_id: str = "string"
    date_of_birth: str = "string"
    gender: str = "string"
    visit_date: str = "string"
    referred_from: str = "string"
    referred_to: str = "string"
    diagnosis: List[str] = Field(default_factory=lambda: ["string"])
    symptoms: List[str] = Field(default_factory=lambda: ["string"])
    investigations: List[str] = Field(default_factory=lambda: ["string"])
    medications: List[Medication] = Field(default_factory=lambda: [Medication()])
    allergies: List[str] = Field(default_factory=lambda: ["string"])
    notes: str = "string"
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0


class Detection(BaseModel):
    label: str
    confidence: float
    box: List[float]

class ProcessResponse(BaseModel):
    record: StructuredMedicalRecord
    detections: List[Detection] = Field(default_factory=list)
    raw_ocr_text: str
    session_id: str
    metadata: dict = Field(default_factory=dict)
    message: str
    annotated_image_base64: str