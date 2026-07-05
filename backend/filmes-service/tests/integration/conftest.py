import os

# Testes de integração usam um Postgres real (docker-compose.local.yml ou o
# serviço equivalente subido no job de CI), diferente do valor fictício que
# tests/conftest.py define via setdefault só para satisfazer o pydantic
# Settings nos testes unitários mockados. Por isso sobrescrevemos aqui, antes
# de qualquer import de app.core.database, em vez de usar setdefault.
os.environ["DATABASE_URL"] = os.environ.get(
    "INTEGRATION_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/trabalho_if",
)

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
