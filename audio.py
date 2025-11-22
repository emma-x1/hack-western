import sounddevice as sd, soundfile as sf
import numpy as np

def list_devices():
    for i, d in enumerate(sd.query_devices()):
        print(i, d["name"], d["max_output_channels"])

if __name__ == "__main__":
    list_devices()

def play_on_device(wav_path: str, device_index: int):
    audio, sr = sf.read(wav_path, dtype="float32")
    
    # Handle mono audio - convert to match device channels
    if audio.ndim == 1:
        # Get device info to check max channels
        device_info = sd.query_devices(device_index)
        max_channels = device_info['max_output_channels']
        
        if max_channels == 0:
            raise ValueError(f"Device {device_index} ({device_info['name']}) has no output channels")
        
        # If device supports stereo, duplicate mono to both channels
        if max_channels >= 2:
            audio = audio.reshape(-1, 1).repeat(2, axis=1)
    
    sd.play(audio, sr, device=device_index, blocking=True)
