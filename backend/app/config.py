import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Software Quality Prediction API"
    API_V1_STR: str = "/api"
    
    # Database
    # Default to local SQLite if Supabase is not configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./codeguardian.db")
    
    # Authentication (Clerk)
    CLERK_FRONTEND_API: str = os.getenv("CLERK_FRONTEND_API", "")
    CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY", "")
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
    CLERK_JWKS_URL: str = os.getenv(
        "CLERK_JWKS_URL", 
        "https://clerk.dev/.well-known/jwks.json" # Overwritten dynamically if clerk keys are set
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Storage (Use /tmp on Linux/Render to support read-only cloud filesystems)
    STORAGE_DIR: str = "/tmp/codeguardian" if os.name != "nt" else "./storage"
    
    # Mock Auth Toggle (for local development without Clerk configure)
    BYPASS_AUTH: bool = True

    class Config:
        case_sensitive = True

settings = Settings()
settings.DATABASE_URL = settings.DATABASE_URL.strip()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "datasets"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "models"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "reports"), exist_ok=True)
