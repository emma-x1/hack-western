from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator import run_debate
import os

app = FastAPI()

# CORS - Allow all for development/hackathon ease
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for audio serving
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Starts a debate among the ducks about the provided message/topic.
    Returns a list of speech objects with audio URLs.
    """
    try:
        print(f"Received topic: {request.message}")
        # Generate the conversation (this might take a few seconds)
        speeches = run_debate(request.message, turns=6)
        return {"speeches": speeches}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"status": "The Quack Council is in session. Backend is ready."}
