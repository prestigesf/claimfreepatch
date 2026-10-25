# main.py
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def ai_disclosure_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-AI-Disclosure"] = "This interaction is powered by AI."
    return response
