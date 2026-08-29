import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
GROQ_MODEL = 'qwen/qwen3.8-27b'

class GroqClient:
    def __init__(self):
        self.headers = {
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json'
        }
        # Limit concurrent requests to avoid rate limits
        import asyncio
        self.semaphore = asyncio.Semaphore(5)
        
    async def analyze(self, system_prompt, user_prompt):
        if not GROQ_API_KEY:
            raise Exception("No API key provided")
            
        payload = {
            'model': GROQ_MODEL,
            'messages': [
                { 'role': 'system', 'content': system_prompt },
                { 'role': 'user', 'content': user_prompt }
            ],
            'temperature': 0.1, # Low temp for analytical tasks
            'response_format': { 'type': 'json_object' }
        }
        
        async with self.semaphore:
            async with httpx.AsyncClient() as client:
                response = await client.post(GROQ_API_URL, headers=self.headers, json=payload, timeout=10.0)
                
                if response.status_code != 200:
                    raise Exception(f"Groq API error {response.status_code}: {response.text}")
                    
                data = response.json()
                content = data['choices'][0]['message']['content']
                return json.loads(content)

groq_client = GroqClient()
