from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import os
from typing import List
from openai import AsyncOpenAI
from auth.firebase_auth import get_optional_user
from services import firestore_service
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# The system prompt instructs Sarah Alex on her persona
SYSTEM_PROMPT = """
You are Sarah Alex, an empathetic, professional, and knowledgeable medical assistant for the NeuroLens clinic.
NeuroLens is an AI-powered neurological screening platform that helps evaluate voice, spiral drawing precision, and finger tapping speed to assess early signs of neurological conditions like Parkinson's disease.

Your directives:
1. Answer patient queries about their health issues calmly and supportively.
2. If asked about the NeuroLens tests:
   - Voice test: The patient holds an 'ahhh' sound to measure jitter, shimmer, and vocal tremors.
   - Spiral test: Visuospatial coordination tracking by tracing a spiral shape.
   - Tap test: Finger tapping speed to measure motor rhythm and latent response.
3. Advise patients that you are an AI assistant and cannot provide an official medical diagnosis.
4. Keep your answers concise, reassuring, and under 4-5 sentences.
"""

@router.post("/ask", response_model=ChatResponse)
async def ask_chat(request: ChatRequest, current_user: dict | None = Depends(get_optional_user)):
    if not GROQ_API_KEY:
         # Fallback mock if the user forgets to add GROQ_API_KEY
         return ChatResponse(reply="I am Sarah Alex! Please tell my developer to add a GROQ_API_KEY to the backend .env file so I can become a fully functional AI.")

    dynamic_prompt = SYSTEM_PROMPT
    if current_user:
        # Context-Awareness: Inject user's name and test scores into the prompt
        uid = current_user["uid"]
        user_profile = firestore_service.get_user(uid)
        
        if user_profile and "name" in user_profile:
            dynamic_prompt += f"\n\nContext-Awareness: You are currently talking to {user_profile['name']}."
            
        # Get their latest test results to give personalized advice
        try:
            history = firestore_service.get_user_history(uid)
            if history:
                latest = history[0]
                dynamic_prompt += (
                    f" Their most recent NeuroLens test results are: "
                    f"Voice score {latest.get('voice_score')}%, "
                    f"Spiral score {latest.get('spiral_score')}%, "
                    f"Tap score {latest.get('tap_score')}%. "
                    f"If they ask, you can mention these scores and explain what they mean soothingly."
                )
        except Exception as e:
            print(f"[Chat Context Error] Could not fetch user history: {e}")

    # Build the memory chain
    messages = [{"role": "system", "content": dynamic_prompt}]
    
    # 1. Add conversation history
    for msg in request.history:
        if msg.role in ["user", "assistant"]:
            messages.append({"role": msg.role, "content": msg.content})
            
    # 2. Add current message
    messages.append({"role": "user", "content": request.message})

    try:
        completion = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )
        
        return ChatResponse(reply=completion.choices[0].message.content.strip())
        
    except Exception as e:
        print(f"[Chatbot Error] {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="I'm having trouble connecting to my AI brain right now. Please try again later."
        )
