import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.0-flash"

def generate_reply(character, history: str) -> str:
    """
    Generates a reply for a specific character based on the conversation history.
    """
    sys = (
        f"You are {character['name']}. {character['prompt']} "
        f"Speak in a {character['style']} tone. "
        "Keep your response short (under 2 sentences). "
        "React to the previous messages in the conversation history."
    )
    
    model = genai.GenerativeModel(MODEL_ID, system_instruction=sys)
    
    # We pass the conversation history as the user prompt to contextually generate the next line
    response = model.generate_content(f"Here is the conversation so far:\n\n{history}\n\nYour turn to speak:")
    return response.text.strip()
