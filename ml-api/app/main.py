"""FastAPI application entry point."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cache.redis_client import check_redis_health
from app.db.connection import check_db_health
from app.models.lgbm_model import load_production_model
from app.routers import backtest
from app.routers import explain
from app.routers import heatmap
from app.routers import news
from app.routers import predict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bangalore RE Predictor API",
    version="1.0.0",
    docs_url="/docs",
)

# CORS: only allow requests from Vercel deployment and localhost dev
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_URL", "http://localhost:4321"),
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict.router)
app.include_router(heatmap.router)
app.include_router(explain.router)
app.include_router(news.router)
app.include_router(backtest.router)


@app.on_event("startup")
async def startup() -> None:
    """Load ML model into memory on startup."""
    logger.info("Loading production model...")
    load_production_model()
    logger.info("API ready")


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "db": check_db_health(),
        "redis": check_redis_health(),
    }
