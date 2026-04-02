import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import analysis, scores, auth

load_dotenv()

app = FastAPI(
    title="NeuroLens API",
    description="Neurological screening API — voice, spiral, and tap motor tests",
    version="2.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(analysis.router, tags=["Analysis"])
app.include_router(scores.router, tags=["Scores"])
app.include_router(auth.router, tags=["Authentication"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "NeuroLens API v2"}
