from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    gemini_api_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    cors_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/junctn"
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = str(_ENV_FILE)


settings = Settings()
