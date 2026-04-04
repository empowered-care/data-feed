import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from crawl4ai import AsyncWebCrawler
from services.gemini_service import GeminiService
from models.schemas import ContextData

logger = logging.getLogger(__name__)

class ContextResearchAgent:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        # We can define sources to crawl for information
        self.sources = [
            "https://www.bing.com/news/search?q={location}+outbreak+security+water",
            "https://www.google.com/search?q={location}+weather+temperature+conflict+zone"
        ]

    async def research(self, location: str) -> ContextData:
        """
        Research contextual information about a location using Crawl4AI.
        Focuses on security, water, temperature, and conflict status.
        """
        logger.info(f"🌐 Researching context for location: {location}")
        
        # 1. Generate specific research topics using Gemini
        research_prompt = f"""
        Given the location '{location}', generate 3 specific search queries to find information about:
        1. Current security status and conflict zones.
        2. Water quality and accessibility issues.
        3. Environmental conditions (temperature, recent floods/droughts).
        
        Return the queries as a simple list.
        """
        
        try:
            # Generate queries (sync call via thread)
            loop = asyncio.get_event_loop()
            queries_raw = await loop.run_in_executor(None, self.gemini.generate_text, research_prompt)
            # Simple cleanup of the list
            queries = [q.strip("- ").strip() for q in queries_raw.split("\n") if q.strip()]
            
            logger.info(f"🔍 Generated search queries: {queries}")
            
            scraped_content = []
            
            # 2. Use Crawl4AI to gather data
            async with AsyncWebCrawler() as crawler:
                for query in queries[:2]: # Limit to 2 queries for speed
                    search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                    logger.info(f"🕷️ Crawling: {search_url}")
                    
                    result = await crawler.arun(url=search_url)
                    if result and result.markdown:
                        scraped_content.append(result.markdown[:2000]) # Cap content size

            # 3. Analyze scraped content using Gemini
            analysis_prompt = f"""
            Analyze the following research data for the location '{location}'.
            Data:
            {' '.join(scraped_content)}
            
            Extract the following details in JSON format:
            - security_status: Summary of safety and conflict status.
            - water_quality: Status of water sources and hygiene.
            - temperature: Current or typical temperature/weather.
            - conflict_zone: Boolean (true if actively in a conflict area).
            - nearby_facilities: List of key hospitals or infrastructure mentioned.
            - recent_news: List of top 2-3 relevant recent headlines.
            
            JSON format:
            {{
                "security_status": "string",
                "water_quality": "string",
                "temperature": "string",
                "conflict_zone": boolean,
                "nearby_facilities": ["f1", "f2"],
                "recent_news": ["news1", "news2"]
            }}
            """
            
            response = await loop.run_in_executor(None, self.gemini.generate_text, analysis_prompt)
            import json
            # Handle potential markdown in Gemini response
            if "```json" in response:
                json_text = response.split("```json")[1].split("```")[0].strip()
            elif "```" in response:
                json_text = response.split("```")[1].split("```")[0].strip()
            else:
                json_text = response.strip()
                
            data = json.loads(json_text)
            
            context = ContextData(
                location=location,
                security_status=data.get("security_status"),
                water_quality=data.get("water_quality"),
                temperature=data.get("temperature"),
                conflict_zone=data.get("conflict_zone", False),
                nearby_facilities=data.get("nearby_facilities", []),
                recent_news=data.get("recent_news", []),
                last_updated=datetime.now()
            )
            
            logger.info(f"✅ Context research complete for {location}")
            return context

        except Exception as e:
            logger.error(f"❌ Context research failed for {location}: {e}")
            # Return basic info if research fails
            return ContextData(
                location=location,
                security_status="Data unavailable",
                water_quality="Data unavailable",
                temperature="Normal",
                conflict_zone=False
            )
