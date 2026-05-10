from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")  # ajustado para o exe, se necessário

settings = Settings()
settings.DATABASE_URL = settings.DATABASE_URL.strip()
