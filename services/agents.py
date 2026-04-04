import json
import logging
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from models.schemas import OutbreakReport, ValidationResult, RiskAnalysis, AlertMessage, ConsensusResult, ContextData
from services.gemini_service import GeminiService
from services.research_agent import ContextResearchAgent
from config import VALID_SYMPTOMS, MAX_STORED_REPORTS, BASE_DIR

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define absolute storage path
DATA_STORE_PATH = BASE_DIR / "models" / "outbreak_data.json"

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
            
            # Ensure additional_info is a dictionary
            if not isinstance(data.get("additional_info"), dict):
                val = data.get("additional_info")
                data["additional_info"] = {"raw_value": val} if val else {}

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

    async def analyze_risk(self, report: OutbreakReport, perspective: str = "general", context: ContextData = None) -> RiskAnalysis:
        """Analyze outbreak risk level from a specific perspective."""
        logger.info(f"Analyzing risk for {report.location} from perspective: {perspective}")

        context_info = ""
        if context:
            context_info = f"""
            Additional Context from Web Research:
            - Security Status: {context.security_status}
            - Water Quality: {context.water_quality}
            - Environmental (Temp): {context.temperature}
            - Conflict Zone: {"Yes" if context.conflict_zone else "No"}
            - Recent News: {', '.join(context.recent_news)}
            """

        prompt = f"""
        You are a Risk Analysis Sub-Agent specializing in {perspective}.
        Analyze the risk level for this potential disease outbreak:

        Location: {report.location}
        Symptoms: {', '.join(report.symptoms)}
        Cases: {report.cases}
        Date: {report.date or 'Not specified'}
        {context_info}

        Perspective Specific Instructions:
        - If perspective is 'symptoms': Focus on clinical patterns and disease matches.
        - If perspective is 'statistical': Focus on case count growth and population density.
        - If perspective is 'historical': Focus on seasonal trends and known regional hotspots.
        - If perspective is 'environmental': Focus on how water, security, and conflict impact transmission.
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
        self.research_agent = ContextResearchAgent(gemini_service)

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
        
        # 2. Dynamic Research Agent (New step based on location)
        context_data = None
        if report.location and report.location != "Unknown":
            logger.info(f"🧠 SuperAgent: Spawning Research Agent for {report.location}...")
            context_data = await self.research_agent.research(report.location)

        # 3. Dynamic Validation Sub-Agents
        # We use one primary validator but it could be expanded to cross-check sub-agents
        validation_result = await self.validator.validate(report)
        
        # 4. Dynamic Risk Sub-Agents (PERSPECTIVE-BASED)
        # Use research data in risk analysis if available
        perspectives = ["symptoms", "statistical", "historical", "environmental"]
        logger.info(f"🧠 SuperAgent: Spawning {len(perspectives)} Risk Sub-Agents...")
        
        risk_tasks = [self.risk_agent.analyze_risk(report, p, context_data) for p in perspectives]
        risk_opinions = await asyncio.gather(*risk_tasks)
        
        # 5. Merge Layer / Consensus
        consensus = self._reach_consensus(risk_opinions)
        
        # 6. Alert Generation
        alert = await self.alert_agent.generate_alert(report, consensus)
        
        return {
            "extracted_data": report,
            "validation": validation_result,
            "risk_analysis": risk_opinions[0], # Maintain compatibility
            "consensus": consensus,
            "context_research": context_data,
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
        self.storage_path = DATA_STORE_PATH
        self._load_data()
        logger.info(f"Data Assistant initialized with {len(self.data_store)} reports at {self.storage_path}")

    def _load_data(self):
        """Load data from local storage."""
        try:
            import os
            import json
            if os.path.exists(self.storage_path):
                with open(self.storage_path, "r") as f:
                    self.data_store = json.load(f)
                logger.info(f"Successfully loaded {len(self.data_store)} reports from {self.storage_path}")
        except Exception as e:
            logger.error(f"❌ Failed to load data store from {self.storage_path}: {e}")
            self.data_store = []

    def _save_data(self):
        """Save data to local storage."""
        try:
            import json
            import os
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w") as f:
                json.dump(self.data_store, f, indent=4)
            logger.info(f"Successfully saved {len(self.data_store)} reports to {self.storage_path}")
        except Exception as e:
            logger.error(f"❌ Failed to save data store to {self.storage_path}: {e}")

    def add_report(self, report: Union[OutbreakReport, Dict[str, Any]], session_id: str = None, risk_analysis: Dict[str, Any] = None, alert: Dict[str, Any] = None, context_research: Dict[str, Any] = None):
        """Add a report to the data store with full context."""
        report_dict = report.dict() if hasattr(report, "dict") else report
        
        # Add metadata for dashboard
        entry = {
            "session_id": session_id or str(uuid.uuid4()),
            "extracted_data": report_dict,
            "risk_analysis": risk_analysis or {"risk_level": "LOW"},
            "context_research": context_research,
            "alert": alert or {"title": "New Report"},
            "status": "pending",
            "timestamp": str(datetime.now())
        }
        
        self.data_store.insert(0, entry) # Newest first
        if len(self.data_store) > MAX_STORED_REPORTS:
            self.data_store = self.data_store[:MAX_STORED_REPORTS]
        
        self._save_data()
        logger.info(f"Added report to data store. Total reports: {len(self.data_store)}")

    async def query(self, query_text: str) -> Dict[str, Any]:
        """Answer queries about outbreak data."""
        logger.info(f"Processing query: {query_text}")

        total_reports = len(self.data_store)
        locations = list(set(r["extracted_data"]["location"] for r in self.data_store if r["extracted_data"]["location"] != "Unknown"))
        total_cases = sum(r["extracted_data"].get("cases", 0) for r in self.data_store)

        data_summary = {
            "total_reports": total_reports,
            "total_cases": total_cases,
            "locations": locations
        }

        prompt = f"""
        You are a Senior Data Analyst for Empowered Care, a high-performance multi-agent disease outbreak monitoring system. 
        Your goal is to provide intelligent, professional insights about epidemiological data.

        USER QUERY: "{query_text}"
        
        AGGREGATE DATA SUMMARY:
        {json.dumps(data_summary, indent=2)}
        
        DETAILED ENTRIES (Most Recent):
        {json.dumps([r["extracted_data"] for r in self.data_store[-10:]] if self.data_store else [], indent=2)}
        
        INSTRUCTIONS:
        1. IDENTITY: You are part of Empowered Care. 
        2. PROFESSIONAL ANALYSIS: Interpret the data in the context of public health safety.
        3. NATURAL LANGUAGE: Respond in a fluid, authoritative, and helpful manner.
        4. ACCURACY: Base your answer strictly on the provided data. 
        5. NO DATA SCENARIO: If there is zero data in the context above, acknowledge it professionally and explain that Empowered Care is currently in monitoring mode, awaiting data ingestion from field reports.
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

    async def perform_full_analysis(self) -> Dict[str, Any]:
        """Perform a deep analysis comparing new data with historical trends."""
        logger.info("Performing full system analysis and comparison...")
        
        if not self.data_store:
            return {
                "status": "No data available",
                "analysis": "No data points collected yet for analysis.",
                "timestamp": str(datetime.now())
            }

        # Newest are at the beginning (index 0)
        new_data = [r["extracted_data"] for r in self.data_store[:5]]
        old_data = [r["extracted_data"] for r in self.data_store[5:25]] # Compare with next 20

        prompt = f"""
        You are a Senior Epidemiological Analyst. Perform a full system analysis.
        
        HISTORICAL DATA (Summarized):
        {json.dumps(old_data) if old_data else "No historical data."}
        
        NEW RECENT DATA (Last 5 reports):
        {json.dumps(new_data)}
        
        TASK:
        1. Compare the new data with historical trends.
        2. Identify if any new outbreaks are emerging or if existing ones are worsening.
        3. Provide a 'Result' summary including an overall risk level (LOW/MEDIUM/HIGH).
        4. Detect anomalies (e.g., sudden case spikes in new locations).
        
        Format your response as valid JSON:
        {{
          "overall_risk": "string",
          "comparison_summary": "string",
          "anomalies_detected": ["string"],
          "trend_analysis": "string",
          "recommendations": ["string"]
        }}
        """

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.gemini.generate_text, prompt)
            analysis_result = json.loads(response)
            analysis_result["timestamp"] = str(datetime.now())
            analysis_result["data_points_analyzed"] = len(self.data_store)
            return analysis_result
        except Exception as e:
            logger.error(f"Full analysis failed: {e}")
            return {
                "error": str(e),
                "status": "Analysis failed",
                "timestamp": str(datetime.now())
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
        You are the {self.role} for Empowered Care, a sophisticated multi-agent disease outbreak detection system.
        Your expertise is {self.expertise}.

        SYSTEM IDENTITY:
        Empowered Care is a cutting-edge AI-powered epidemiological surveillance tool designed to detect, analyze, and alert health officials about potential disease outbreaks in real-time. 
        
        DATA CONTEXT (REAL-TIME SYSTEM DATA):
        {data_context}
        
        CONVERSATION HISTORY:
        {history_str}
        
        USER REQUEST:
        "{message}"
        
        GUIDELINES:
        1. IDENTITY: Always identify as Empowered Care.
        2. BE PROFESSIONAL YET FRIENDLY: Use a tone suitable for a health official or clinical researcher, but be approachable. If the user greets you with "hey", "hello", or "hi", respond warmly and ask how you can help them specifically with their surveillance tasks.
        3. BE SMART: Don't just list data. Interpret it. Identify transmission patterns and risks.
        4. NO DATA SCENARIO: If the data context shows zero cases/reports and the user asks about outbreaks, explain that Empowered Care is in standby/monitoring mode, actively scanning for anomalies but currently reporting a clean epidemiological status.
        5. PRECISION: Use exact numbers from the data when possible.
        
        RESPONSE EXAMPLE FOR GREETINGS:
        User: "Hey"
        Response: "Hello! I'm the Empowered Care Assistant. I'm currently monitoring our epidemiological data streams. How can I assist you with your outbreak detection or data analysis today?"
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
        You are the Routing Logic for Empowered Care, a sophisticated multi-agent system.
        Analyze the USER MESSAGE and route it to the best specialist agent.
        
        MESSAGE: "{message}"
        
        AVAILABLE SPECIALISTS:
        - "location": Geospatial surveillance and hotspots.
        - "infection": Symptoms, clinical details, and risk levels.
        - "history": Timelines, dates, and historical comparison.
        - "general": Greetings, overall system summaries, or broad requests.
        
        Return ONLY the single word (lower case): location, infection, history, or general.
        """
        
        loop = asyncio.get_event_loop()
        agent_key = await loop.run_in_executor(None, self.gemini.generate_text, route_prompt)
        agent_key = agent_key.lower().strip()
        if agent_key not in self.specialists:
            agent_key = "general"
            
        # 2. Prepare data context (Enhanced with a more complete summary)
        total_reports = len(self.data_assistant.data_store)
        locations = list(set(r["extracted_data"]["location"] for r in self.data_assistant.data_store if r["extracted_data"]["location"] != "Unknown"))
        total_cases = sum(r["extracted_data"].get("cases", 0) for r in self.data_assistant.data_store)
        
        data_summary = {
            "total_system_reports": total_reports,
            "aggregate_cases": total_cases,
            "monitored_locations": locations,
            "most_recent_entries": [r["extracted_data"] for r in self.data_assistant.data_store[-15:]] if self.data_assistant.data_store else []
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