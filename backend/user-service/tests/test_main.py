import sys
from unittest.mock import patch

from fastapi.testclient import TestClient


def _import_fresh_main():
    # app.main executa Base.metadata.create_all(bind=engine) no import, o que
    # tentaria abrir uma conexão real com o Postgres. Isso é substituído por um
    # mock para que o teste não dependa de infraestrutura externa.
    with patch("app.core.db_usuario.Base.metadata.create_all") as mock_create_all:
        sys.modules.pop("app.main", None)
        import app.main as main_module

    return main_module, mock_create_all


def test_main_cria_app_e_registra_rotas_e_tabelas() -> None:
    main_module, mock_create_all = _import_fresh_main()

    mock_create_all.assert_called_once()
    assert main_module.app.title == "FastAPI"

    client = TestClient(main_module.app)
    resp = client.get("/openapi.json")

    assert resp.status_code == 200
    paths = resp.json()["paths"]
    assert "/api/v1/users/" in paths
    assert "/api/v1/users/{user_id}" in paths
    assert "/api/v1/users/login" in paths


def test_main_docs_endpoint_disponivel() -> None:
    main_module, _ = _import_fresh_main()

    client = TestClient(main_module.app)
    resp = client.get("/docs")

    assert resp.status_code == 200
