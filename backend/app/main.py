import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transactions, dashboard, simulation, ml, disputes
from app.services.generator import LogGenerator
from app.database.db import db

app = FastAPI(
    title="Anti-Fraud System API",
    description="Python FastAPI backend for real-time medical services fraud detection (Hard Block, Velocity Rules, Financial Patterns, Travel Verification).",
    version="1.0.0"
)

# CORS configurations for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local simulation, allow all. In prod, lock to specific URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(simulation.router)
app.include_router(ml.router)
app.include_router(disputes.router)

@app.on_event("startup")
def startup_event():
    # If transaction log is empty, generate an initial batch
    if not db.transactions:
        print("[Startup] Seeding initial database with 150 mock transactions...")
        LogGenerator.generate_batch(150)
        print(f"[Startup] Seeding complete. Total transactions: {len(db.transactions)}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Anti-Fraud Monitoring Engine",
        "description": "API is online. Access /docs for Swagger documentation."
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
