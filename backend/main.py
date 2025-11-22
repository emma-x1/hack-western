from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator import run_debate, reset_history, run_single_turn
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

class ChatRequest(BaseModel):
    message: str
    user_name: str = "User" 
    mode: str = "chat" # "chat" or "debug"

class DuckChatRequest(BaseModel):
    duck_id: int
    user_name: str = "User"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Continues the conversation (group debate).
    The backend maintains memory of previous turns.
    """
    try:
        print(f"Request: mode={request.mode}, user={request.user_name}, msg={request.message}")
        speeches = run_debate(request.message, request.user_name, turns=4, mode=request.mode)
        return {"speeches": speeches}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/duck")
async def duck_chat_endpoint(request: DuckChatRequest):
    """
    Triggers a specific duck to speak based on the current context.
    """
    try:
        print(f"Single duck request: duck_id={request.duck_id}, user={request.user_name}")
        # We don't need a new message from user, just a trigger for the duck to speak next
        speeches = run_single_turn(request.duck_id, request.user_name)
        return {"speeches": speeches}
    except Exception as e:
        print(f"Error in duck chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_endpoint():
    """Clears conversation memory."""
    reset_history()
    return {"status": "Memory wiped. The ducks have forgotten everything."}

@app.get("/")
def root():
    return {"status": "The Quack Council is in session."}
