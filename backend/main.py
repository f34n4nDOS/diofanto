from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, math, algebra

app = FastAPI(title="Diofanto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(math.router)
app.include_router(algebra.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}