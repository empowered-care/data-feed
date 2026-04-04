import asyncio
import logging
import sys
import os

# Add the current directory to sys.path to allow importing local modules
sys.path.append(os.getcwd())

from services.gemini_service import GeminiService
from services.research_agent import ContextResearchAgent

# Configure logging to see the progress
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ScrapingTest")

async def test_scraping():
    logger.info("🚀 Starting Scraping Feature Test...")
    
    try:
        # 1. Initialize Gemini Service
        gemini = GeminiService()
        logger.info("✅ Gemini Service initialized.")
        
        # 2. Initialize Research Agent
        research_agent = ContextResearchAgent(gemini)
        logger.info("✅ Context Research Agent initialized.")
        
        # 3. Define a test location (using a region where context is highly relevant)
        test_location = "Gondar, Ethiopia"
        logger.info(f"🔍 Researching context for: {test_location}")
        
        # 4. Execute research
        context = await research_agent.research(test_location)
        
        # 5. Validate and Print Results
        print("\n" + "="*50)
        print(f"📡 RESEARCH RESULTS FOR: {context.location}")
        print("="*50)
        print(f"🔒 Security Status: {context.security_status}")
        print(f"💧 Water Quality:   {context.water_quality}")
        print(f"🌡️  Temperature:     {context.temperature}")
        print(f"⚔️  Conflict Zone:   {'YES' if context.conflict_zone else 'NO'}")
        print(f"🏥 Facilities:      {', '.join(context.nearby_facilities) if context.nearby_facilities else 'None found'}")
        print(f"📰 Recent News:")
        for i, news in enumerate(context.recent_news, 1):
            print(f"   {i}. {news}")
        print(f"⏰ Last Updated:    {context.last_updated}")
        print("="*50 + "\n")
        
        if context.security_status and context.security_status != "Data unavailable":
            logger.info("✅ Test PASSED: Successfully retrieved and analyzed web data.")
        else:
            logger.warning("⚠️ Test COMPLETED with partial data: Check if crawling was blocked or Gemini failed to parse.")

    except Exception as e:
        logger.error(f"❌ Test FAILED with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_scraping())
