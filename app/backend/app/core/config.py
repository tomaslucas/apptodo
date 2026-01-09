import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación."""

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AppTodo"
    VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./app.db"

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ]

    # Password hashing
    PASSWORD_MIN_LENGTH: int = 8
    BCRYPT_ROUNDS: int = 12

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REFRESH: str = "10/minute"
    RATE_LIMIT_BATCH: str = "20/minute"

    class Config:
        env_file = ".env"


settings = Settings()
