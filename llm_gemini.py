import os, google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash"

def generate_reply(character, question: str) -> str:
    sys = (
        f"You are {character['name']}. Speak in a {character['style']} tone. "
        f"{character['prompt']} Answer in under 120 words and end with one clear recommendation."
    )
    model = genai.GenerativeModel(MODEL_ID, system_instruction=sys)
    response = model.generate_content(question)
    return response.text.strip()
