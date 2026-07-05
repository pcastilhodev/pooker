from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db

app.dependency_overrides[get_db] = lambda: MagicMock()

client = TestClient(app)


def _make_filme(**kwargs):
    defaults = dict(
        id=1,
        titulo="Matrix",
        genero="Ficção",
        ano=1999,
        preco_aluguel=9.90,
        sinopse=None,
        imagem_url=None,
        duracao_minutos=None,
        elenco=None,
        diretor=None,
        diretor_foto_url=None,
        classificacao_indicativa=None,
        data_lancamento=None,
        total_copias=5,
        copias_disponiveis=5,
        reviews=[],
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_health_check():
    response = client.get("/")
    assert response.json()["status"] == "ok, filmes-service"


def test_get_all_filmes():
    with patch("app.api.v1.routes.filmes.filme_service.get_all", return_value=[_make_filme()]):
        response = client.get("/v1/filmes/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_filme_sem_role_retorna_401():
    payload = {
        "titulo": "Matrix",
        "genero": "Ficção",
        "ano": 1999,
        "preco_aluguel": 9.90,
        "total_copias": 5,
    }
    response = client.post("/v1/filmes/", json=payload)
    assert response.status_code == 401


def test_create_filme_admin_sucesso():
    payload = {
        "titulo": "Matrix",
        "genero": "Ficção",
        "ano": 1999,
        "preco_aluguel": 9.90,
        "total_copias": 5,
    }
    with patch("app.api.v1.routes.filmes.filme_service.create", return_value=_make_filme()):
        response = client.post("/v1/filmes/", json=payload, headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 201
    assert response.json()["titulo"] == "Matrix"


def test_create_filme_role_nao_permitida_retorna_403():
    payload = {
        "titulo": "Matrix",
        "genero": "Ficção",
        "ano": 1999,
        "preco_aluguel": 9.90,
        "total_copias": 5,
    }
    response = client.post("/v1/filmes/", json=payload, headers={"X-User-Role": "USER"})
    assert response.status_code == 403


def test_create_filme_erro_servico_retorna_500():
    payload = {
        "titulo": "Matrix",
        "genero": "Ficção",
        "ano": 1999,
        "preco_aluguel": 9.90,
        "total_copias": 5,
    }
    with patch("app.api.v1.routes.filmes.filme_service.create", side_effect=Exception("falha")):
        response = client.post("/v1/filmes/", json=payload, headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 500


def test_get_filme_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.get", return_value=_make_filme()):
        response = client.get("/v1/filmes/1")

    assert response.status_code == 200
    assert response.json()["id"] == 1


def test_get_filme_nao_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.get", return_value=None):
        response = client.get("/v1/filmes/999")

    assert response.status_code == 404


def test_update_filme_sucesso():
    payload = {
        "titulo": "Matrix Reloaded",
        "genero": "Ficção",
        "ano": 2003,
        "preco_aluguel": 12.90,
        "total_copias": 5,
        "copias_disponiveis": 5,
    }
    with patch("app.api.v1.routes.filmes.filme_service.update", return_value=_make_filme(titulo="Matrix Reloaded")):
        response = client.put("/v1/filmes/1", json=payload, headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 200
    assert response.json()["titulo"] == "Matrix Reloaded"


def test_update_filme_nao_encontrado():
    payload = {
        "titulo": "Matrix Reloaded",
        "genero": "Ficção",
        "ano": 2003,
        "preco_aluguel": 12.90,
        "total_copias": 5,
        "copias_disponiveis": 5,
    }
    with patch("app.api.v1.routes.filmes.filme_service.update", return_value=None):
        response = client.put("/v1/filmes/999", json=payload, headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 404


def test_delete_filme_sucesso():
    with patch("app.api.v1.routes.filmes.filme_service.delete", return_value=True):
        response = client.delete("/v1/filmes/1", headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 204


def test_delete_filme_nao_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.delete", return_value=False):
        response = client.delete("/v1/filmes/999", headers={"X-User-Role": "ADMIN"})

    assert response.status_code == 404


def test_search_filmes_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.search", return_value=[_make_filme()]):
        response = client.get("/v1/filmes/search/", params={"titulo": "Matrix"})

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_filmes_nao_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.search", return_value=[]):
        response = client.get("/v1/filmes/search/", params={"titulo": "Inexistente"})

    assert response.status_code == 404


def test_update_inventario_sucesso():
    with patch("app.api.v1.routes.filmes.filme_service.update_inventario", return_value=_make_filme(copias_disponiveis=4)):
        response = client.patch("/v1/filmes/1/inventario", json={"acao": "alugar", "quantidade": 1})

    assert response.status_code == 200
    assert response.json()["copias_disponiveis"] == 4


def test_update_inventario_nao_encontrado():
    with patch("app.api.v1.routes.filmes.filme_service.update_inventario", return_value=None):
        response = client.patch("/v1/filmes/999/inventario", json={"acao": "alugar", "quantidade": 1})

    assert response.status_code == 404
