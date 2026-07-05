from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> Iterator[TestClient]:
    # app.main registra Base.metadata.create_all(bind=engine) no lifespan, que só
    # roda com `with TestClient(...)`. Usando o TestClient "solto" (sem `with`),
    # o lifespan não é acionado e o teste não tenta abrir uma conexão real com
    # o Postgres, irrelevante para o que queremos testar aqui.
    from app.main import app

    yield TestClient(app)


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
