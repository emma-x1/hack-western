import os
import soundfile as sf
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv()
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

def tts_to_wav(text: str, voice_id: str, out_path: str):
    audio_stream = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        output_format="mp3_44100_128"
    )
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Collect all MP3 data
    mp3_data = b""
    for chunk in audio_stream:
        mp3_data += chunk
    
    # Write MP3, then convert to WAV using soundfile
    mp3_path = out_path.replace('.wav', '.mp3')
    with open(mp3_path, "wb") as f:
        f.write(mp3_data)
    
    # Read MP3 and save as WAV
    audio_array, sr = sf.read(mp3_path)
    sf.write(out_path, audio_array, sr)
    
    # Clean up temp MP3
    Path(mp3_path).unlink()
    return out_path
