from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, entries, subjects, topics

app = FastAPI(title="Study Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(topics.router)
app.include_router(entries.router)


@app.get("/health")
def health():
    return {"status": "ok"}
