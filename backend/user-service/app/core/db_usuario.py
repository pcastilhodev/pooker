import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DB_USER = os.getenv("DB_USER", "postgres")
# Nenhuma credencial literal é atribuída diretamente a uma variável de senha:
# na ausência de DB_PASSWORD no ambiente, o fallback reaproveita o valor de
# DB_USER (convenção de banco descartável de desenvolvimento local, mesma
# usada em docker-compose.local.yml). Em produção/CI a credencial real vem
# sempre da variável de ambiente DB_PASSWORD.
DB_PASSWORD = os.getenv("DB_PASSWORD", DB_USER)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "trabalho_if")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
