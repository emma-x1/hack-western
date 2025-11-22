from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hi Sophia Cloudfare is working"}

# 

#@app.post("/listen")
# get input from mic, speech to text
async def listen():
    pass

#@app.post("/choose-agent")
# use biometric/face sensing to pick which agent to use
async def choose_agent():
    pass

#@app.post("/generate-response")
# gemini API to create output dialogue
async def generate_response():
    pass

#@app.post("/speak-response")
# elevenlabs to speak response
async def speak_response():
    pass

@app.post("/start")
# initialize memory, conversation
async def start():
    pass

@app.post("/speak")
# start mic/recording, send to backend
# create output
# generate audio file, send back
# better websocket?
async def speak():
    pass
