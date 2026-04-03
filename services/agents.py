import json
import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Union
from models.schemas import OutbreakReport, ValidationResult, RiskAnalysis, AlertMessage, ConsensusResult
from services.gemini_service import GeminiService
from config import VALID_SYMPTOMS, MAX_STORED_REPORTS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExtractionAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    async def extract(self, text: str) -> OutbreakReport:
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
            # Using loop.run_in_executor to run synchronous Gemini call in a thread
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
            data = json.loads(response)

            # Handle case where Gemini returns a list instead of an object
            if isinstance(data, list):
                if len(data) > 0:
                    data = data[0]
                else:
                    data = {}

            # Validate required fields
            if not data.get("location"):
                data["location"] = "Unknown"
            if not data.get("symptoms"):
                data["symptoms"] = []
            if not isinstance(data.get("cases"), int):
                try:
                    data["cases"] = int(data.get("cases", 1))
                except:
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

    async def validate(self, report: OutbreakReport) -> ValidationResult:
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
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
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

    async def analyze_risk(self, report: OutbreakReport, perspective: str = "general") -> RiskAnalysis:
        """Analyze outbreak risk level from a specific perspective."""
        logger.info(f"Analyzing risk for {report.location} from perspective: {perspective}")

        prompt = f"""
        You are a Risk Analysis Sub-Agent specializing in {perspective}.
        Analyze the risk level for this potential disease outbreak:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}
        Date: {report.date or 'Not specified'}

        Perspective Specific Instructions:
        - If perspective is 'symptoms': Focus on clinical patterns and disease matches.
        - If perspective is 'statistical': Focus on case count growth and population density.
        - If perspective is 'historical': Focus on seasonal trends and known regional hotspots.
        - Otherwise: Provide a general epidemiological risk assessment.

        Risk levels: HIGH, MEDIUM, LOW

        Return JSON:
        {{
          "risk_level": "HIGH/MEDIUM/LOW",
          "confidence": "percentage",
          "possible_disease": "most likely disease",
          "reason": "brief explanation based on your perspective"
        }}
        """

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
            data = json.loads(response)

            risk_level = data.get("risk_level", "UNKNOWN").upper()
            if risk_level not in ["HIGH", "MEDIUM", "LOW"]:
                risk_level = "MEDIUM"

            return RiskAnalysis(
                risk_level=risk_level,
                confidence=data.get("confidence", "50%"),
                possible_disease=data.get("possible_disease", "Unknown"),
                reason=data.get("reason", "Analysis completed")
            )

        except Exception as e:
            logger.error(f"Risk analysis ({perspective}) failed: {e}")
            return RiskAnalysis(
                risk_level="UNKNOWN",
                confidence="0%",
                possible_disease="Unknown",
                reason=f"Analysis failed: {str(e)}"
            )

class AlertGenerationAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    async def generate_alert(self, report: OutbreakReport, risk: Union[RiskAnalysis, ConsensusResult]) -> AlertMessage:
        """Generate human-readable alert message based on merged analysis."""
        
        # Determine the data to use
        if isinstance(risk, ConsensusResult):
            risk_level = risk.final_risk_level
            reasoning = risk.final_reasoning
            disease = risk.agent_opinions[0].possible_disease if risk.agent_opinions else "Potential Disease Outbreak"
        else:
            risk_level = risk.risk_level
            reasoning = risk.reason
            disease = risk.possible_disease

        logger.info(f"Generating alert for {risk_level} risk in {report.location}")

        prompt = f"""
        Generate a clear, actionable alert message for this outbreak:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}
        Risk Level: {risk_level}
        Possible Disease: {disease}
        Merged Analysis: {reasoning}

        Create a response in JSON format including:
        - title: Clear, urgent title
        - message: Detailed summary
        - recommendations: List of immediate actions
        - prevention_strategy: A simple, easy-to-understand solution on how to prevent further cases.
        - why_urgent: A very simple explanation of why this alert was generated (the risk factors).

        Keep the language simple for the general public.

        Return JSON:
        {{
          "title": "Alert title",
          "message": "Detailed summary",
          "recommendations": ["rec1", "rec2"],
          "prevention_strategy": "Simple prevention steps...",
          "why_urgent": "Why this matters now..."
        }}
        """

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
            data = json.loads(response)

            return AlertMessage(
                title=data.get("title", f"Health Alert: {report.location}"),
                message=data.get("message", f"Potential outbreak in {report.location}"),
                recommendations=data.get("recommendations", ["Seek medical attention", "Follow local health guidelines"]),
                prevention_strategy=data.get("prevention_strategy", "Maintain good hygiene and follow local health advice."),
                why_urgent=data.get("why_urgent", f"Identified a cluster of {report.cases} cases in {report.location}.")
            )

        except Exception as e:
            logger.error(f"Alert generation failed: {e}")
            return AlertMessage(
                title="Health Alert",
                message=f"Potential outbreak in {report.location}. Risk level: {risk_level}.",
                recommendations=["Seek medical attention", "Follow local health guidelines"]
            )

class SuperAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.extractor = ExtractionAgent(gemini_service)
        self.validator = ValidationAgent(gemini_service)
        self.risk_agent = RiskAnalysisAgent(gemini_service)
        self.alert_agent = AlertGenerationAgent(gemini_service)

    async def process_outbreak_parallel(self, text: str) -> Dict[str, Any]:
        """Dynamic hierarchical processing of outbreak reports."""
        logger.info(f"🧠 SuperAgent: Initializing dynamic pipeline for: {text[:50]}...")
        
        # 1. Dynamic Extraction Scaling
        # Split text if it's too large (for sub-agents to process chunks)
        if len(text) > 1000:
            logger.info("🧠 SuperAgent: Input large, spawning extraction sub-agents...")
            # Split by sentences or chunks (simple implementation)
            chunks = [text[i:i+800] for i in range(0, len(text), 800)]
            extraction_tasks = [self.extractor.extract(c) for c in chunks]
            reports = await asyncio.gather(*extraction_tasks)
            # Merge reports (take first valid one or merge cases)
            report = reports[0] if reports else await self.extractor.extract(text)
        else:
            report = await self.extractor.extract(text)
        
        # 2. Dynamic Validation Sub-Agents
        # We use one primary validator but it could be expanded to cross-check sub-agents
        validation_result = await self.validator.validate(report)
        
        # 3. Dynamic Risk Sub-Agents (PERSPECTIVE-BASED)
        perspectives = ["symptoms", "statistical", "historical"]
        logger.info(f"🧠 SuperAgent: Spawning {len(perspectives)} Risk Sub-Agents...")
        
        risk_tasks = [self.risk_agent.analyze_risk(report, p) for p in perspectives]
        risk_opinions = await asyncio.gather(*risk_tasks)
        
        # 4. Merge Layer / Consensus
        consensus = self._reach_consensus(risk_opinions)
        
        # 5. Alert Generation
        alert = await self.alert_agent.generate_alert(report, consensus)
        
        return {
            "extracted_data": report,
            "validation": validation_result,
            "risk_analysis": risk_opinions[0], # Maintain compatibility
            "consensus": consensus,
            "alert": alert
        }

    def _reach_consensus(self, opinions: List[RiskAnalysis]) -> ConsensusResult:
        """Consensus logic: Voting + Confidence Averaging."""
        logger.info("🧠 SuperAgent: Reaching consensus among Risk Sub-Agents...")
        
        risk_values = {"HIGH": 3, "MEDIUM": 2, "LOW": 1, "UNKNOWN": 0}
        risk_names = {v: k for k, v in risk_values.items()}
        
        total_risk_score = 0
        total_confidence = 0
        
        for op in opinions:
            total_risk_score += risk_values.get(op.risk_level, 0)
            # Parse confidence string (e.g. "75%")
            try:
                conf = float(op.confidence.strip('%'))
            except:
                conf = 50.0
            total_confidence += conf
            
        avg_risk_score = round(total_risk_score / len(opinions))
        final_risk = risk_names.get(avg_risk_score, "MEDIUM")
        avg_conf = total_confidence / len(opinions)
        
        final_reasoning = "Consensus reached from multiple perspectives: " + \
                        " | ".join([f"{op.risk_level}: {op.reason[:50]}..." for op in opinions])
        
        return ConsensusResult(
            final_risk_level=final_risk,
            average_confidence=avg_conf,
            consensus_reached=True,
            agent_opinions=opinions,
            final_reasoning=final_reasoning
        )

class DataAssistantAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.data_store = []
        logger.info("Data Assistant initialized")

    def add_report(self, report: OutbreakReport):
        """Add a report to the data store."""
        self.data_store.append(report.dict())
        if len(self.data_store) > MAX_STORED_REPORTS:
            self.data_store = self.data_store[-MAX_STORED_REPORTS:]
        logger.info(f"Added report to data store. Total reports: {len(self.data_store)}")

    async def query(self, query_text: str) -> Dict[str, Any]:
        """Answer queries about outbreak data."""
        logger.info(f"Processing query: {query_text}")

        total_reports = len(self.data_store)
        locations = list(set(r["location"] for r in self.data_store if r["location"] != "Unknown"))
        total_cases = sum(r.get("cases", 0) for r in self.data_store)

        data_summary = {
            "total_reports": total_reports,
            "total_cases": total_cases,
            "locations": locations
        }

        prompt = f"""
        Answer this query about outbreak data: "{query_text}"
        Summary: {json.dumps(data_summary)}
        Recent: {json.dumps(self.data_store[-5:] if self.data_store else [])}
        """

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
            return {
                "query": query_text,
                "response": response,
                "data_summary": data_summary
            }
        except Exception as e:
            logger.error(f"Query processing failed: {e}")
            return {
                "query": query_text,
                "response": "Unable to process query.",
                "data_summary": data_summary
            }

# --- NEW POWERFUL CHATBOT SYSTEM ---

class ChatSpecialistAgent:
    def __init__(self, gemini_service: GeminiService, role: str, expertise: str):
        self.gemini = gemini_service
        self.role = role
        self.expertise = expertise

    async def respond(self, message: str, history: List[Dict[str, str]], data_context: str) -> str:
        history_str = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        
        prompt = f"""
        You are the {self.role} for Aegis Lite. Your expertise is {self.expertise}.
        
        DATA CONTEXT FROM SYSTEM:
        {data_context}
        
        CONVERSATION HISTORY:
        {history_str}
        
        USER QUESTION:
        {message}
        
        INSTRUCTIONS:
        1. Answer based ON THE DATA provided above.
        2. If the data doesn't contain the answer, say so clearly.
        3. Be professional and epidemiological in your tone.
        4. Keep your answer concise but complete.
        """
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.gemini.generate_text, prompt)

class ChatSupervisor:
    def __init__(self, gemini_service: GeminiService, data_assistant: DataAssistantAgent):
        self.gemini = gemini_service
        self.data_assistant = data_assistant
        self.sessions: Dict[str, List[Dict[str, Any]]] = {}
        
        # Initialize specialists
        self.specialists = {
            "location": ChatSpecialistAgent(gemini_service, "Location Specialist", "Geographic trends, hotspots, and area-specific data."),
            "infection": ChatSpecialistAgent(gemini_service, "Infection Specialist", "Symptoms, disease types, risk levels, and clinical details."),
            "history": ChatSpecialistAgent(gemini_service, "History Specialist", "Timelines, dates, and historical comparison of reports."),
            "general": ChatSpecialistAgent(gemini_service, "General Assistant", "Overall summaries and general epidemiological support.")
        }

    def _get_history(self, session_id: str) -> List[Dict[str, Any]]:
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    async def chat(self, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        sid = session_id or str(uuid.uuid4())
        history = self._get_history(sid)
        
        # 1. Route the query to the correct agent
        route_prompt = f"""
        Analyze this user message and route it to the best specialist:
        - "location": If they ask WHERE, hotspots, or about specific cities.
        - "infection": If they ask about symptoms, WHAT disease, or risk levels.
        - "history": If they ask WHEN, dates, or trends over time.
        - "general": For greetings or overall summaries.
        
        MESSAGE: "{message}"
        
        Return ONLY the word: location, infection, history, or general.
        """
        
        loop = asyncio.get_event_loop()
        agent_key = await loop.run_in_executor(None, self.gemini.generate_text, route_prompt)
        agent_key = agent_key.lower().strip()
        if agent_key not in self.specialists:
            agent_key = "general"
            
        # 2. Prepare data context
        data_summary = {
            "total": len(self.data_assistant.data_store),
            "recent_reports": self.data_assistant.data_store[-10:]
        }
        data_context = json.dumps(data_summary, indent=2)
        
        # 3. Get response from specialist
        agent = self.specialists[agent_key]
        logger.info(f"🤖 Chat: Routing to {agent_key} agent for session {sid}")
        
        response_text = await agent.respond(message, history, data_context)
        
        # 4. Update history
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response_text})
        
        # Keep history manageable (last 10 turns)
        if len(history) > 20:
            self.sessions[sid] = history[-20:]
            
        return {
            "response": response_text,
            "session_id": sid,
            "agent_used": agent_key,
            "history_count": len(history) // 2
        }

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False