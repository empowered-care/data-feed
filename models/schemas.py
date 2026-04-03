from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

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

# Outbreak Detection Schemas

class OutbreakReport(BaseModel):
    location: str
    symptoms: List[str] = Field(default_factory=list)
    cases: int
    date: Optional[str] = None
    additional_info: Dict[str, Any] = Field(default_factory=dict)

class ValidationResult(BaseModel):
    valid: bool
    confidence: float
    issues: List[str] = Field(default_factory=list)

class RiskAnalysis(BaseModel):
    risk_level: str  # HIGH, MEDIUM, LOW
    confidence: str
    possible_disease: str
    reason: str

class ConsensusResult(BaseModel):
    final_risk_level: str
    average_confidence: float
    consensus_reached: bool
    agent_opinions: List[RiskAnalysis] = Field(default_factory=list)
    final_reasoning: str

class AlertMessage(BaseModel):
    title: str
    message: str
    recommendations: List[str] = Field(default_factory=list)
    prevention_strategy: Optional[str] = None
    why_urgent: Optional[str] = None

class OutbreakProcessResponse(BaseModel):
    extracted_data: OutbreakReport
    validation: ValidationResult
    risk_analysis: RiskAnalysis
    consensus: Optional[ConsensusResult] = None
    alert: AlertMessage
    session_id: str
    metadata: dict = Field(default_factory=dict)
    message: str
    human_validation_required: bool = True

class QueryResponse(BaseModel):
    query: str
    response: str
    data_summary: Dict[str, Any] = Field(default_factory=dict)

# Chatbot Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ChatSession(BaseModel):
    session_id: str
    history: List[ChatMessage] = Field(default_factory=list)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_used: str
    history_count: int