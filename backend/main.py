from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, math, algebra, geometry, statistics, exercises, modeling
from routers import auth, math, algebra, geometry, statistics, exercises, modeling, whiteboard
from routers import ml_lab
from routers import probability_lab

app = FastAPI(title="Diofanto API")
app.include_router(ml_lab.router)
app.include_router(probability_lab.router)
app.add_middleware(
    CORSMiddleware,
     allow_origins=["https://diofanto.xyz", "https://www.diofanto.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://diofanto.xyz", "https://www.diofanto.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print(">>> DIOFANTO DEBUG: CORS origins configurados =", ["https://diofanto.xyz", "https://www.diofanto.xyz"])

app.include_router(exercises.router)
app.include_router(statistics.router)
app.include_router(auth.router)
app.include_router(math.router)
app.include_router(algebra.router)
app.include_router(geometry.router)
app.include_router(modeling.router)
app.include_router(whiteboard.router)
@app.get("/health")
def health_check():
    return {"status": "ok"}