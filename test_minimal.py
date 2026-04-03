#!/usr/bin/env python3
"""
Minimal test for Aegis Lite agents
"""

from fastapi import FastAPI
from services.gemini_service import GeminiService
from services.agents import ExtractionAgent, ValidationAgent, RiskAnalysisAgent, AlertGenerationAgent, DataAssistantAgent

print("🚀 Starting minimal Aegis Lite test...")

try:
    gemini_service = GeminiService()
    print("✅ Gemini service initialized")

    extraction_agent = ExtractionAgent(gemini_service)
    validation_agent = ValidationAgent(gemini_service)
    risk_agent = RiskAnalysisAgent(gemini_service)
    alert_agent = AlertGenerationAgent(gemini_service)
    data_assistant = DataAssistantAgent(gemini_service)
    print("✅ All agents initialized")

    app = FastAPI(title="Aegis Lite Test")

    @app.get("/")
    async def root():
        return {"message": "Aegis Lite is running!"}

    @app.post("/test")
    async def test_extraction(text: str):
        result = extraction_agent.extract(text)
        return result.dict()

    print("✅ FastAPI app created")
    print("🚀 Starting server...")

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()