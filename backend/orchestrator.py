import json
import time
import random
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from llm_gemini import generate_reply
from tts_eleven import tts_to_wav

# Load characters once
CHARACTERS = json.loads(Path("characters.json").read_text())

def get_character_by_name(name):
    return next((c for c in CHARACTERS if c["name"] == name), None)

def run_debate(topic: str, turns: int = 5):
    """
    Simulates a debate among the ducks.
    Returns a list of speech objects: {duckId, text, audioUrl, duration}
    """
    ts = time.strftime("%Y%m%d-%H%M%S")
    # Create a static directory for serving audio files
    static_dir = Path("static/audio") / ts
    static_dir.mkdir(parents=True, exist_ok=True)

    history_text = f"Topic: {topic}\n"
    conversation_log = []
    
    # Ducks: Gordon(1), Joy(2), Blues(3), Dexter(4), Goose(5)
    # Map names to IDs as per frontend expectation
    name_to_id = {
        "Gordon": 1,
        "Joy": 2,
        "Blues": 3,
        "Dexter": 4,
        "Goose": 5
    }

    # 1. Generate the conversation text sequentially
    # We pick a random starter, then random next speakers
    current_speaker = random.choice(CHARACTERS)
    
    print(f"Starting debate on: {topic}")

    for i in range(turns):
        # Generate text
        text = generate_reply(current_speaker, history_text)
        
        # Add to history
        history_text += f"{current_speaker['name']}: {text}\n"
        
        # Record the turn
        turn_data = {
            "duckId": name_to_id.get(current_speaker["name"], 1),
            "character": current_speaker,
            "text": text,
            "filename": f"{i}_{current_speaker['name']}.wav"
        }
        conversation_log.append(turn_data)
        
        # Pick next speaker (different from current)
        candidates = [c for c in CHARACTERS if c["name"] != current_speaker["name"]]
        current_speaker = random.choice(candidates)

    # 2. Generate Audio in Parallel
    final_output = []
    
    with ThreadPoolExecutor(max_workers=3) as ex:
        # Submit all TTS jobs
        future_to_turn = {}
        for turn in conversation_log:
            out_path = static_dir / turn["filename"]
            # We store the relative path for the frontend to access
            # Assuming backend serves /static at root or similar
            web_path = f"/static/audio/{ts}/{turn['filename']}"
            
            future = ex.submit(
                tts_to_wav, 
                turn["text"], 
                turn["character"]["voice_id"], 
                str(out_path)
            )
            future_to_turn[future] = {**turn, "audioUrl": web_path}

        # Collect results
        for future in as_completed(future_to_turn):
            data = future_to_turn[future]
            try:
                # The function returns the path, we just ensure it finished
                future.result()
                # Estimate duration based on word count (rough heuristic: 3 words per second)
                # or get actual duration if tts returned it (it doesn't currently).
                # Frontend can use audio duration event, but we provide a fallback estimate.
                word_count = len(data["text"].split())
                data["duration"] = max(2000, word_count * 400) # ms
                
                # Clean up internal objects
                del data["character"] 
                final_output.append(data)
            except Exception as e:
                print(f"Error generating audio for {data['text']}: {e}")

    # Sort by the original order (filename prefix has index)
    final_output.sort(key=lambda x: int(Path(x["audioUrl"]).name.split('_')[0]))
    
    return final_output
