import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def list_available_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        return

    genai.configure(api_key=api_key)
    
    print("🔍 Fetching available Gemini models...")
    try:
        models = genai.list_models()
        print("\n✅ Available Models:")
        found_any = False
        for m in models:
            found_any = True
            print(f"- {m.name} (Methods: {', '.join(m.supported_generation_methods)})")
        
        if not found_any:
            print("No models found. Check your API key permissions.")
            
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
