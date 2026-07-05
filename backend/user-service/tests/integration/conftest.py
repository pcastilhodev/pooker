import os

# Testes de integração usam um Postgres real (docker-compose.local.yml ou o
# serviço equivalente subido no job de CI). app.core.db_usuario monta a URL a
# partir de DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (com os mesmos
# valores default do docker-compose.local.yml), então normalmente nem
# precisaríamos setar nada — mas fixamos aqui para o teste não depender de um
# .env local e para permitir override explícito em CI, sempre antes de
# qualquer import de app.core.db_usuario.
os.environ["DB_HOST"] = os.environ.get("INTEGRATION_DB_HOST", "localhost")
os.environ["DB_PORT"] = os.environ.get("INTEGRATION_DB_PORT", "5432")
os.environ["DB_NAME"] = os.environ.get("INTEGRATION_DB_NAME", "trabalho_if")
os.environ["DB_USER"] = os.environ.get("INTEGRATION_DB_USER", "postgres")
os.environ["DB_PASSWORD"] = os.environ.get("INTEGRATION_DB_PASSWORD", "postgres")

from collections.abc import Iterator

import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.core.db_usuario import Base, engine


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
