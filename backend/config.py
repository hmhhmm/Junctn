from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    cors_origin: str = "http://localhost:3000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/junctn"
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"


settings = Settings()
