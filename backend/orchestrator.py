import json
import time
import random
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from llm_gemini import generate_reply
from tts_eleven import tts_to_wav

# Load characters once
CHARACTERS = json.loads(Path("characters.json").read_text())

# In-memory storage for conversation history per session/user (simplified for hackathon)
# key: "default" (or user_id), value: list of strings (history)
conversations = {}

def get_character_by_name(name):
    return next((c for c in CHARACTERS if c["name"] == name), None)

def run_debate(user_message: str, user_name: str = "User", turns: int = 3, mode: str = "chat"):
    """
    Simulates a debate turn.
    - user_message: The latest input from the user.
    - user_name: The name of the user.
    - turns: How many ducks speak in response to this user message.
    - mode: "chat" (interactive) or "debug" (observe only/topic based)
    
    Returns a list of speech objects: {duckId, text, audioUrl, duration}
    """
    
    print(f"starting run_debate with params: {user_message}", {user_name}, {turns}, {mode})
    ts = time.strftime("%Y%m%d-%H%M%S")
    static_dir = Path("static/audio") / ts
    static_dir.mkdir(parents=True, exist_ok=True)

    # Initialize or Retrieve History
    session_id = "default" 
    if session_id not in conversations:
        conversations[session_id] = []
    
    history = conversations[session_id]
    
    # Add Message to History based on mode
    if mode == "chat":
        history.append(f"{user_name}: {user_message}")
    else:
        # In debug mode, maybe the user message is a system event or topic
        history.append(f"SYSTEM: The topic is now: {user_message}")

    # Increase history buffer to avoid forgetting too quickly
    if len(history) > 50:
        history = history[-50:]
    
    # Format history string for LLM
    history_text = "CONVERSATION HISTORY:\n" + "\n".join(history)
    
    conversation_log = []
    name_to_id = {
        "Gordon": 1, "Joy": 2, "Blues": 3, "Dexter": 4, "Goose": 5
    }

    # 1. Pick a random starter
    # In chat mode, ducks should reply to the user. 
    # In debug mode, they might just talk amongst themselves.
    current_speaker = random.choice(CHARACTERS)
    
    print(f"Processing message: {user_message} (Mode: {mode})")
    print(f"Current History Length: {len(history)}")

    for i in range(turns):
        # Generate text using the updated history
        text = generate_reply(current_speaker, history_text)
        
        # Add to history immediately so next duck sees it
        line = f"{current_speaker['name']}: {text}"
        history.append(line)
        history_text += f"\n{line}"
        
        # Record
        turn_data = {
            "duckId": name_to_id.get(current_speaker["name"], 1),
            "character": current_speaker,
            "text": text,
            "filename": f"{i}_{current_speaker['name']}.wav"
        }
        conversation_log.append(turn_data)
        
        # Pick next speaker
        candidates = [c for c in CHARACTERS if c["name"] != current_speaker["name"]]
        current_speaker = random.choice(candidates)

    # Update global history store
    conversations[session_id] = history

    # Generate Audio
    final_output = []
    with ThreadPoolExecutor(max_workers=3) as ex:
        future_to_turn = {}
        for turn in conversation_log:
            out_path = static_dir / turn["filename"]
            web_path = f"/static/audio/{ts}/{turn['filename']}"
            
            future = ex.submit(
                tts_to_wav, 
                turn["text"], 
                turn["character"]["voice_id"], 
                str(out_path)
            )
            future_to_turn[future] = {**turn, "audioUrl": web_path}

        for future in as_completed(future_to_turn):
            data = future_to_turn[future]
            try:
                future.result()
                word_count = len(data["text"].split())
                data["duration"] = max(2000, word_count * 400)
                del data["character"] 
                final_output.append(data)
            except Exception as e:
                print(f"Error generating audio: {e}")

    final_output.sort(key=lambda x: int(Path(x["audioUrl"]).name.split('_')[0]))
    return final_output

def reset_history():
    conversations["default"] = []
