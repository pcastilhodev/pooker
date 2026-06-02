from pathlib import Path

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    FILMES_SERVICE_URL: str | None = None
    USUARIOS_SERVICE_URL: str | None = None

    class Config:
        env_file = ENV_PATH
        env_file_encoding = "utf-8"


settings = Settings()
print(f"DATABASE_URL = {settings.DATABASE_URL}")
