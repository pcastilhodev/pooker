import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("FILMES_SERVICE_URL", "http://filmes-service:8003")
os.environ.setdefault("USUARIOS_SERVICE_URL", "http://user-service:8000")

import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session


@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)
