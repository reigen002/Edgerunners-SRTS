"""
FastAPI app factory — SRTS (Smart Rental Tracking System)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, get_db, SessionLocal
from app.models import Base
from app.seed import seed_database
from app.routers import assets, alerts, recommendations, forecasts
from app.routers.alerts import refresh_alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Auto-seed on first start
    db = SessionLocal()
    try:
        counts = seed_database(db)
        if any(v > 0 for v in counts.values()):
            print(f"[SRTS] Database seeded: {counts}")
            # Generate initial alerts from seed data
            refresh_alerts(db)
            print("[SRTS] Initial alert scan complete.")
    finally:
        db.close()

    yield
    # No teardown needed for SQLite demo


app = FastAPI(
    title="SRTS — Smart Rental Tracking System",
    description=(
        "Caterpillar dealer backend for rental asset tracking, "
        "telemetry, anomaly detection, and demand forecasting."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins for hackathon (frontend dev server will be on a different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(assets.router)
app.include_router(alerts.router)
app.include_router(recommendations.router)
app.include_router(forecasts.router)


# ---------------------------------------------------------------------------
# Admin / utility endpoints
# ---------------------------------------------------------------------------

from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed import reset_database


@app.post("/admin/seed", tags=["Admin"])
def admin_seed(db: Session = Depends(get_db)):
    """Insert seed data if missing. Safe to call multiple times."""
    return seed_database(db)


@app.post("/admin/reset", tags=["Admin"])
def admin_reset(db: Session = Depends(get_db)):
    """
    DANGER: Delete ALL data and re-seed from scratch.
    Useful for demo resets between presentations.
    """
    counts = reset_database(db)
    refresh_alerts(db)
    return {"status": "reset_complete", "seeded": counts}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "SRTS Backend"}


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "SRTS — Smart Rental Tracking System",
        "docs": "/docs",
        "redoc": "/redoc",
    }
