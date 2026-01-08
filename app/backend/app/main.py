from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.core.config import settings
from app.core.database import init_db, get_engine
from app.routers import auth

# Inicializar base de datos
init_db()

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/ready")
def readiness_check():
    """Readiness check endpoint."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {
            "status": "ready",
            "checks": {
                "database": "ok"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}"
        )


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
