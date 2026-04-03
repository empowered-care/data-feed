from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from database.db import Base
from datetime import datetime

class PatientRecord(Base):
    __tablename__ = "patient_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=True) # For image-based results
    source_file = Column(String, nullable=True) # Filename of Image or Excel
    
    # Core Patient Info
    patient_name = Column(String, index=True)
    patient_id = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    visit_date = Column(String, nullable=True)
    
    # Clinical Data
    document_type = Column(String, nullable=True)
    referred_from = Column(String, nullable=True)
    referred_to = Column(String, nullable=True)
    
    diagnosis = Column(JSON, nullable=True) # Stored as list
    symptoms = Column(JSON, nullable=True) # Stored as list
    investigations = Column(JSON, nullable=True) # Stored as list
    medications = Column(JSON, nullable=True) # Stored as list of dicts
    allergies = Column(JSON, nullable=True)
    
    notes = Column(Text, nullable=True)
    additional_info = Column(JSON, nullable=True)
    
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.now)

def init_db():
    from database.db import engine
    Base.metadata.create_all(bind=engine)
