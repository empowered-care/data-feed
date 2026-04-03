from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str

class StructuredMedicalRecord(BaseModel):
    document_type: Optional[str] = "Medical Record"
    patient_name: str
    patient_id: Optional[str] = None

    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    visit_date: Optional[str] = None
    referred_from: Optional[str] = None
    referred_to: Optional[str] = None
    diagnosis: List[str] = Field(default_factory=list)
    symptoms: List[str] = Field(default_factory=list)
    investigations: List[str] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    confidence: float

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