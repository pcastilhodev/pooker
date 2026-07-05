import sys
from collections.abc import Iterator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> Iterator[TestClient]:
    # app.main chama Base.metadata.create_all(bind=engine) na importação, o que
    # tentaria abrir uma conexão real com o Postgres. Isso é irrelevante para o
    # que queremos testar aqui (a instância do FastAPI e o health check), então
    # substituímos create_all por um no-op só durante a importação do módulo.
    sys.modules.pop("app.main", None)
    with patch("sqlalchemy.schema.MetaData.create_all", return_value=None):
        from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    sys.modules.pop("app.main", None)


def test_health_check_retorna_status_ok(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok, filmes-service"}


def test_app_possui_routers_de_filmes_e_reviews(client: TestClient) -> None:
    paths = {route.path for route in client.app.routes}  # type: ignore[attr-defined]

    assert "/v1/filmes/" in paths
    assert "/v1/reviews/" in paths


def test_app_possui_cors_middleware(client: TestClient) -> None:
    from starlette.middleware.cors import CORSMiddleware

    middleware_classes = [m.cls for m in client.app.user_middleware]  # type: ignore[attr-defined]

    assert CORSMiddleware in middleware_classes
