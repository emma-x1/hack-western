import json, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from llm_gemini import generate_reply
from tts_eleven import tts_to_wav
from audio import play_on_device

def run_session(question: str):
    ts = time.strftime("%Y%m%d-%H%M%S")
    out_dir = Path("runs") / ts
    out_dir.mkdir(parents=True, exist_ok=True)

    characters = json.loads(Path("characters.json").read_text())
    devices = json.loads(Path("devices.json").read_text())

    # 1) Generate replies (Gemini)
    results = []
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(generate_reply, c, question): c for c in characters}
        for f in as_completed(futures):
            c = futures[f]
            results.append({
                "char": c["name"],
                "text": f.result(),
                "voice_id": c["voice_id"]
            })

    # 2) TTS (ElevenLabs)
    audio_paths = []
    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = {
            ex.submit(tts_to_wav, r["text"], r["voice_id"], str(out_dir / f"{r['char']}.wav")): r
            for r in results
        }
        for f in as_completed(futures):
            r = futures[f]
            audio_paths.append({
                "char": r["char"],
                "wav": f.result(),
                "text": r["text"]
            })

    # 3) Playback (one by one for clarity)
    for a in sorted(audio_paths, key=lambda x: x["char"]):
        print(f"\n🎙️ {a['char']} says:\n{a['text']}\n")
        play_on_device(a["wav"], devices[a["char"]])
