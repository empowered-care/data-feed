import json
import logging
from typing import Dict, Any, List, Optional
from models.schemas import OutbreakReport, ValidationResult, RiskAnalysis, AlertMessage
from services.gemini_service import GeminiService
from config import VALID_SYMPTOMS, MAX_STORED_REPORTS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExtractionAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    def extract(self, text: str) -> OutbreakReport:
        """Extract structured data from raw outbreak report text."""
        if not text or not text.strip():
            logger.warning("Empty text provided to extraction agent")
            return OutbreakReport(
                location="Unknown",
                symptoms=[],
                cases=0,
                additional_info={"error": "Empty input text"}
            )

        prompt = f"""
        You are an Extraction Agent for disease outbreak detection.
        Convert the following messy text report into structured JSON data.

        Input text: "{text.strip()}"

        Extract:
        - location: The place mentioned (city, region, etc.)
        - symptoms: List of symptoms mentioned
        - cases: Number of affected people (if mentioned, otherwise 1)
        - date: Any date mentioned (optional)
        - additional_info: Any other relevant information

        Return ONLY valid JSON:
        {{
          "location": "string",
          "symptoms": ["symptom1", "symptom2"],
          "cases": number,
          "date": "string or null",
          "additional_info": {{}}
        }}
        """

        try:
            logger.info(f"Extracting data from text: {text[:50]}...")
            response = self.gemini.generate_text(prompt)
            data = json.loads(response)

            # Validate required fields
            if not data.get("location"):
                data["location"] = "Unknown"
            if not data.get("symptoms"):
                data["symptoms"] = []
            if not isinstance(data.get("cases"), int) or data["cases"] < 0:
                data["cases"] = 1

            report = OutbreakReport(**data)
            logger.info(f"Successfully extracted: {report.location}, {report.cases} cases")
            return report

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
            return OutbreakReport(
                location="Unknown",
                symptoms=["Unknown"],
                cases=1,
                additional_info={"raw_text": text, "error": f"JSON parsing failed: {str(e)}"}
            )
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return OutbreakReport(
                location="Unknown",
                symptoms=["Unknown"],
                cases=1,
                additional_info={"raw_text": text, "error": str(e)}
            )

class ValidationAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    def validate(self, report: OutbreakReport) -> ValidationResult:
        """Validate outbreak report for reasonableness."""
        logger.info(f"Validating report for {report.location}")

        # Rule-based validation
        issues = []

        if not report.location or report.location == "Unknown":
            issues.append("Missing or unknown location")

        if not report.symptoms or len(report.symptoms) == 0:
            issues.append("No symptoms reported")
        else:
            # Check for valid symptoms
            invalid_symptoms = [s for s in report.symptoms if s.lower() not in [vs.lower() for vs in VALID_SYMPTOMS]]
            if invalid_symptoms:
                issues.append(f"Unusual symptoms detected: {', '.join(invalid_symptoms)}")

        if report.cases <= 0:
            issues.append("Invalid number of cases (must be positive)")
        elif report.cases > 1000:
            issues.append("Unrealistically high number of cases")

        # AI validation for reasonableness
        prompt = f"""
        Validate this outbreak report for reasonableness:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}

        Check for:
        - Unrealistic numbers
        - Impossible symptom combinations
        - Missing critical information
        - Geographic plausibility

        Return JSON:
        {{
          "valid": true/false,
          "confidence": 0.0-1.0,
          "issues": ["issue1", "issue2"]
        }}
        """

        try:
            response = self.gemini.generate_text(prompt)
            validation_data = json.loads(response)

            # Merge with rule-based issues
            all_issues = issues + validation_data.get("issues", [])
            confidence = min(validation_data.get("confidence", 0.5), 0.9)  # Cap at 0.9

            result = ValidationResult(
                valid=validation_data.get("valid", len(all_issues) == 0),
                confidence=confidence,
                issues=all_issues
            )

            logger.info(f"Validation complete: valid={result.valid}, confidence={result.confidence}")
            return result

        except Exception as e:
            logger.error(f"AI validation failed: {e}")
            return ValidationResult(
                valid=len(issues) == 0,
                confidence=0.3,
                issues=issues + [f"AI validation failed: {str(e)}"]
            )

class RiskAnalysisAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    def analyze_risk(self, report: OutbreakReport) -> RiskAnalysis:
        """Analyze outbreak risk level and identify possible diseases."""
        logger.info(f"Analyzing risk for {report.location} with {report.cases} cases")

        prompt = f"""
        Analyze the risk level for this potential disease outbreak:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}
        Date: {report.date or 'Not specified'}

        Consider:
        - Symptom patterns and known diseases
        - Number of cases and growth potential
        - Location context and population density
        - Seasonality and environmental factors
        - Similar historical outbreaks

        Risk levels: HIGH (immediate action needed), MEDIUM (monitor closely), LOW (routine surveillance)

        Return JSON:
        {{
          "risk_level": "HIGH/MEDIUM/LOW",
          "confidence": "percentage (e.g., 85%)",
          "possible_disease": "most likely disease or syndrome",
          "reason": "brief explanation with key factors"
        }}
        """

        try:
            response = self.gemini.generate_text(prompt)
            data = json.loads(response)

            # Validate risk level
            risk_level = data.get("risk_level", "UNKNOWN").upper()
            if risk_level not in ["HIGH", "MEDIUM", "LOW"]:
                risk_level = "MEDIUM"  # Default to medium

            result = RiskAnalysis(
                risk_level=risk_level,
                confidence=data.get("confidence", "50%"),
                possible_disease=data.get("possible_disease", "Unknown"),
                reason=data.get("reason", "Analysis completed")
            )

            logger.info(f"Risk analysis: {result.risk_level} - {result.possible_disease}")
            return result

        except Exception as e:
            logger.error(f"Risk analysis failed: {e}")
            return RiskAnalysis(
                risk_level="UNKNOWN",
                confidence="0%",
                possible_disease="Unknown",
                reason=f"Analysis failed: {str(e)}"
            )

class AlertGenerationAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    def generate_alert(self, report: OutbreakReport, risk: RiskAnalysis) -> AlertMessage:
        """Generate human-readable alert message."""
        logger.info(f"Generating alert for {risk.risk_level} risk in {report.location}")

        prompt = f"""
        Generate a clear, actionable alert message for this outbreak:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}
        Risk Level: {risk.risk_level}
        Possible Disease: {risk.possible_disease}
        Analysis: {risk.reason}

        Create a message that includes:
        - Clear, urgent title based on risk level
        - Situation summary with key facts
        - Specific health recommendations
        - When to seek medical help
        - Contact information or next steps

        Keep the message concise but informative.

        Return JSON:
        {{
          "title": "Alert title",
          "message": "Detailed situation summary",
          "recommendations": ["rec1", "rec2", "rec3"]
        }}
        """

        try:
            response = self.gemini.generate_text(prompt)
            data = json.loads(response)

            result = AlertMessage(
                title=data.get("title", f"Health Alert: {report.location}"),
                message=data.get("message", f"Potential outbreak in {report.location}"),
                recommendations=data.get("recommendations", ["Seek medical attention", "Follow local health guidelines"])
            )

            logger.info(f"Alert generated: {result.title}")
            return result

        except Exception as e:
            logger.error(f"Alert generation failed: {e}")
            return AlertMessage(
                title="Health Alert",
                message=f"Potential outbreak in {report.location} with {report.cases} cases showing {', '.join(report.symptoms)}. Risk level: {risk.risk_level}.",
                recommendations=["Seek medical attention", "Follow local health guidelines", "Contact health authorities"]
            )

class DataAssistantAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.data_store = []  # In-memory storage for demo
        logger.info("Data Assistant initialized")

    def add_report(self, report: OutbreakReport):
        """Add a report to the data store."""
        self.data_store.append(report.dict())

        # Limit storage to prevent memory issues
        if len(self.data_store) > MAX_STORED_REPORTS:
            # Remove oldest reports (keep most recent)
            self.data_store = self.data_store[-MAX_STORED_REPORTS:]

        logger.info(f"Added report to data store. Total reports: {len(self.data_store)}")

    def query(self, query_text: str) -> Dict[str, Any]:
        """Answer queries about outbreak data."""
        logger.info(f"Processing query: {query_text}")

        # Prepare data summary
        total_reports = len(self.data_store)
        locations = list(set(r["location"] for r in self.data_store if r["location"] != "Unknown"))
        total_cases = sum(r["cases"] for r in self.data_store)

        # Get risk distribution
        risk_counts = {}
        for r in self.data_store:
            risk = "UNKNOWN"  # Default if not available
            risk_counts[risk] = risk_counts.get(risk, 0) + 1

        data_summary = {
            "total_reports": total_reports,
            "total_cases": total_cases,
            "locations": locations,
            "risk_distribution": risk_counts
        }

        prompt = f"""
        Answer this query about outbreak data: "{query_text}"

        Available data summary:
        {json.dumps(data_summary, indent=2)}

        Recent reports (last 5):
        {json.dumps(self.data_store[-5:] if self.data_store else [], indent=2)}

        Provide a helpful, concise response based on the available data.
        If the query asks for information not in the data, say so clearly.
        """

        try:
            response = self.gemini.generate_text(prompt)
            return {
                "query": query_text,
                "response": response,
                "data_summary": data_summary
            }
        except Exception as e:
            logger.error(f"Query processing failed: {e}")
            return {
                "query": query_text,
                "response": "Unable to process query at this time. Please try again later.",
                "data_summary": data_summary
            }