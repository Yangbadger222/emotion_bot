from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.emotion_model import EmotionClassifier
from rag.query import retrieve_context
from llm import chat_with_llm

app = FastAPI(title="Emotion Support Bot API")

# 添加 CORS 支持，允许 Node.js 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

emotion_clf = EmotionClassifier()

class UserInput(BaseModel):
    message: str

@app.post("/chat")
def chat(user_input: UserInput):
    emo = emotion_clf.predict(user_input.message)
    ctx = retrieve_context(user_input.message, k=3)
    context_text = "\n\n".join(ctx)
    
    prompt = f"""You are an empathetic assistant helping users manage their emotions.
User emotion (model detected): {emo["label"]}
Relevant knowledge (from KB):
{context_text}

User said: {user_input.message}

Based on the emotion and the knowledge, reply in a gentle, concise, and safe way.
If the user shows severe distress, suggest contacting professional help."""
    
    answer = chat_with_llm(prompt)
    
    return {"emotion": emo, "answer": answer}

@app.get("/health")
def health():
    return {"status": "healthy"}
