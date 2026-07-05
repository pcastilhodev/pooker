import os

# app.core.database monta a URL a partir de DB_USER/DB_PASSWORD/DB_HOST/
# DB_PORT/DB_NAME (não usa settings.DATABASE_URL), com defaults que já
# batem com docker-compose.local.yml. Fixamos aqui, antes de qualquer import
# de app.core.database, para o teste não depender de um .env local e para
# permitir override explícito em CI.
os.environ["DB_HOST"] = os.environ.get("INTEGRATION_DB_HOST", "localhost")
os.environ["DB_PORT"] = os.environ.get("INTEGRATION_DB_PORT", "5432")
os.environ["DB_NAME"] = os.environ.get("INTEGRATION_DB_NAME", "trabalho_if")
os.environ["DB_USER"] = os.environ.get("INTEGRATION_DB_USER", "postgres")
os.environ["DB_PASSWORD"] = os.environ.get("INTEGRATION_DB_PASSWORD", "postgres")

# app.core.config.Settings ainda exige DATABASE_URL (usado só por
# FILMES_SERVICE_URL/USUARIOS_SERVICE_URL); tests/conftest.py já define um
# valor fictício via setdefault, suficiente para a validação do pydantic.
os.environ.setdefault("FILMES_SERVICE_URL", "http://localhost:8003")
os.environ.setdefault("USUARIOS_SERVICE_URL", "http://localhost:8000")

from collections.abc import Iterator

import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def _setup_schema() -> Iterator[None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Iterator[Session]:
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.rollback()
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
        session.close()
