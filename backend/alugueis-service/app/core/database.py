import os
import sys
from collections.abc import Iterator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Detecta se está rodando como exe
if getattr(sys, "frozen", False):
    base_path = sys._MEIPASS  # type: ignore[attr-defined]  # atributo PyInstaller em runtime
else:
    base_path = os.path.dirname(__file__)

# Carrega o .env
env_path = os.path.join(base_path, ".env")
load_dotenv(env_path)

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_NAME = os.getenv("DB_NAME", "trabalho_if")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Iterator[Session]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
