import speech_recognition as sr
#import sounddevice as sd
import soundfile as sf
import numpy as np
import tempfile
from io import BytesIO
from fastapi import UploadFile
from pydub import AudioSegment

"""
def listen_for_question() -> str:
    #Listen to microphone and convert speech to text.
    recognizer = sr.Recognizer()
    
    print("Listening... (speak your question)")
    
    duration = 10 
    sample_rate = 16000
    recording = sd.rec(int(duration * sample_rate), 
                       samplerate=sample_rate, 
                       channels=1, 
                       dtype='int16')
    sd.wait()
    
    print("Processing...")
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
        sf.write(temp_file.name, recording, sample_rate)
        
        with sr.AudioFile(temp_file.name) as source:
            audio = recognizer.record(source)
            
        try:
            question = recognizer.recognize_google(audio)
            print(f"You said: {question}\n")
            return question
        except sr.UnknownValueError:
            print("Could not understand audio")
            return ""
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
            return ""
        
"""
        
def stt(audio: UploadFile) -> str:
    print("starting speech to text")
    print(type(audio))
    recognizer = sr.Recognizer()
    
    try:
        # Read the audio file content
        audio_content = audio.file.read()
        
        audio_segment = AudioSegment.from_file(BytesIO(audio_content))
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            audio_segment.export(temp_wav.name, format="wav")
            temp_wav_path = temp_wav.name
            
        # Use the audio file with speech_recognition
        with sr.AudioFile(temp_wav_path) as source:
            audio_data = recognizer.record(source)

        # Perform speech-to-text
        message = recognizer.recognize_google(audio_data)
        return message 
    except sr.UnknownValueError:
        print("Could not understand the audio.")
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return ""
    except Exception as e:
        print(e)
        