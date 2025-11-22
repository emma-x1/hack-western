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

def get_character_by_id(duck_id):
    # Map IDs to names
    id_to_name = {
        1: "Gordon", 2: "Joy", 3: "Blues", 4: "Dexter", 5: "Goose"
    }
    name = id_to_name.get(duck_id)
    return get_character_by_name(name)

def _generate_and_save_turn(character, history_text, i=0):
    """Helper to generate text + audio for a single turn"""
    ts = time.strftime("%Y%m%d-%H%M%S")
    static_dir = Path("static/audio") / ts
    static_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generate Text
    text = generate_reply(character, history_text)
    
    # 2. Generate Audio
    filename = f"{i}_{character['name']}.wav"
    out_path = static_dir / filename
    web_path = f"/static/audio/{ts}/{filename}"
    
    # Call TTS (blocking or async, but here we do it inside the helper)
    # For orchestrator parallelization, we might want to separate this, 
    # but for single turn it's fine.
    tts_to_wav(text, character["voice_id"], str(out_path))
    
    word_count = len(text.split())
    duration = max(2000, word_count * 400)
    
    return {
        "duckId": -1, # Needs to be mapped by caller or we import map here
        "character": character,
        "text": text,
        "audioUrl": web_path,
        "duration": duration,
        "filename": filename
    }

def run_debate(user_message: str, user_name: str = "User", turns: int = 3, mode: str = "chat"):
    """
    Simulates a debate turn.
    Returns a list of speech objects.
    """
    ts = time.strftime("%Y%m%d-%H%M%S")
    static_dir = Path("static/audio") / ts
    static_dir.mkdir(parents=True, exist_ok=True)

    # Initialize History
    session_id = "default" 
    if session_id not in conversations:
        conversations[session_id] = []
    history = conversations[session_id]
    
    # Add User Message
    if mode == "chat":
        history.append(f"{user_name}: {user_message}")
    else:
        history.append(f"SYSTEM: The topic is now: {user_message}")

    if len(history) > 50:
        history = history[-50:]
    
    history_text = "CONVERSATION HISTORY:\n" + "\n".join(history)
    
    conversation_log = []
    name_to_id = {"Gordon": 1, "Joy": 2, "Blues": 3, "Dexter": 4, "Goose": 5}

    current_speaker = random.choice(CHARACTERS)
    
    print(f"Processing message: {user_message} (Mode: {mode})")

    for i in range(turns):
        text = generate_reply(current_speaker, history_text)
        
        line = f"{current_speaker['name']}: {text}"
        history.append(line)
        history_text += f"\n{line}"
        
        turn_data = {
            "duckId": name_to_id.get(current_speaker["name"], 1),
            "character": current_speaker,
            "text": text,
            "filename": f"{i}_{current_speaker['name']}.wav"
        }
        conversation_log.append(turn_data)
        
        candidates = [c for c in CHARACTERS if c["name"] != current_speaker["name"]]
        current_speaker = random.choice(candidates)

    conversations[session_id] = history

    # Generate Audio Parallel
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

def run_single_turn(duck_id: int, user_name: str = "User"):
    """
    Forces a specific duck to respond to the current history.
    """
    character = get_character_by_id(duck_id)
    if not character:
        return []

    session_id = "default"
    if session_id not in conversations:
        conversations[session_id] = []
    history = conversations[session_id]
    
    history_text = "CONVERSATION HISTORY:\n" + "\n".join(history)
    
    # Generate just one turn
    # We reuse the parallel logic or just call directly since it's 1 turn
    ts = time.strftime("%Y%m%d-%H%M%S")
    static_dir = Path("static/audio") / ts
    static_dir.mkdir(parents=True, exist_ok=True)
    
    text = generate_reply(character, history_text)
    
    # Update history
    line = f"{character['name']}: {text}"
    history.append(line)
    conversations[session_id] = history
    
    # TTS
    filename = f"0_{character['name']}.wav"
    out_path = static_dir / filename
    web_path = f"/static/audio/{ts}/{filename}"
    
    tts_to_wav(text, character["voice_id"], str(out_path))
    
    word_count = len(text.split())
    duration = max(2000, word_count * 400)
    
    return [{
        "duckId": duck_id,
        "text": text,
        "audioUrl": web_path,
        "duration": duration
    }]

def reset_history():
    conversations["default"] = []
