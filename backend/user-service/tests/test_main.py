from fastapi.testclient import TestClient

# app.main registra Base.metadata.create_all(bind=engine) no lifespan, que só
# roda com `with TestClient(...)`. Usando o TestClient "solto" (sem `with`),
# o lifespan não é acionado e os testes não dependem de uma conexão real com
# o Postgres.
from app.main import app


def test_main_cria_app_e_registra_rotas_e_tabelas() -> None:
    assert app.title == "FastAPI"

    client = TestClient(app)
    resp = client.get("/openapi.json")

    assert resp.status_code == 200
    paths = resp.json()["paths"]
    assert "/api/v1/users/" in paths
    assert "/api/v1/users/{user_id}" in paths
    assert "/api/v1/users/login" in paths


def test_main_docs_endpoint_disponivel() -> None:
    client = TestClient(app)
    resp = client.get("/docs")

    assert resp.status_code == 200
