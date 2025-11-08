from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_BASE_URL

client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

def chat_with_llm(prompt: str):
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a supportive mental health companion."},
            {"role": "user", "content": prompt}
        ]
    )
    return resp.choices[0].message.content
