from unittest.mock import MagicMock

import pytest
from app.api.v1.routes import filmes as filmes_routes
from app.core.database import get_db
from app.models.filme import Filme
from fastapi import FastAPI
from fastapi.testclient import TestClient

ADMIN_HEADERS = {"X-User-Role": "ADMIN"}


def _make_filme(**kwargs: object) -> Filme:
    defaults: dict[str, object] = dict(
        id=1,
        titulo="Inception",
        genero="Ficção",
        ano=2010,
        sinopse=None,
        imagem_url=None,
        duracao_minutos=None,
        elenco=None,
        diretor=None,
        diretor_foto_url=None,
        classificacao_indicativa=None,
        data_lancamento=None,
        preco_aluguel=9.9,
        total_copias=5,
        copias_disponiveis=3,
    )
    defaults.update(kwargs)
    return Filme(**defaults)


def _filme_payload(**kwargs: object) -> dict[str, object]:
    defaults: dict[str, object] = dict(
        titulo="Matrix",
        genero="Ficção",
        ano=1999,
        preco_aluguel=5.5,
        total_copias=3,
    )
    defaults.update(kwargs)
    return defaults


@pytest.fixture
def client(mock_db: MagicMock) -> TestClient:
    app = FastAPI()
    app.include_router(filmes_routes.router)
    app.dependency_overrides[get_db] = lambda: mock_db
    return TestClient(app)


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------


def test_get_all_filmes(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme()
    query_mock = mock_db.query.return_value.offset.return_value.limit.return_value
    query_mock.all.return_value = [filme]

    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["titulo"] == "Inception"


# ---------------------------------------------------------------------------
# POST /
# ---------------------------------------------------------------------------


def test_create_filme_sucesso(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.refresh.side_effect = lambda obj: setattr(obj, "id", 1)

    response = client.post("/", json=_filme_payload(), headers=ADMIN_HEADERS)

    assert response.status_code == 201
    assert mock_db.add.called
    assert mock_db.commit.called


def test_create_filme_sem_header_role(client: TestClient) -> None:
    response = client.post("/", json=_filme_payload())

    assert response.status_code == 401


def test_create_filme_role_sem_permissao(client: TestClient) -> None:
    response = client.post(
        "/", json=_filme_payload(), headers={"X-User-Role": "CLIENTE"}
    )

    assert response.status_code == 403


def test_create_filme_erro_interno(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        filmes_routes.filme_service,
        "create",
        MagicMock(side_effect=RuntimeError("boom")),
    )

    response = client.post("/", json=_filme_payload(), headers=ADMIN_HEADERS)

    assert response.status_code == 500
    assert "boom" in response.json()["detail"]


# ---------------------------------------------------------------------------
# GET /{filme_id}
# ---------------------------------------------------------------------------


def test_get_filme_existente(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    response = client.get("/1")

    assert response.status_code == 200
    assert response.json()["titulo"] == "Inception"


def test_get_filme_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/999")

    assert response.status_code == 404
    assert response.json()["detail"] == filmes_routes.FILME_NAO_ENCONTRADO


# ---------------------------------------------------------------------------
# PUT /{filme_id}
# ---------------------------------------------------------------------------


def test_update_filme_existente(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = filme
    payload = _filme_payload(titulo="Inception 2", copias_disponiveis=3)

    response = client.put("/1", json=payload, headers=ADMIN_HEADERS)

    assert response.status_code == 200
    assert response.json()["titulo"] == "Inception 2"


def test_update_filme_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None
    payload = _filme_payload(copias_disponiveis=1)

    response = client.put("/999", json=payload, headers=ADMIN_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == filmes_routes.FILME_NAO_ENCONTRADO


def test_update_filme_sem_permissao(client: TestClient) -> None:
    payload = _filme_payload(copias_disponiveis=1)

    response = client.put("/1", json=payload)

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /{filme_id}
# ---------------------------------------------------------------------------


def test_delete_filme_existente(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    response = client.delete("/1", headers=ADMIN_HEADERS)

    assert response.status_code == 204


def test_delete_filme_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.delete("/999", headers=ADMIN_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == filmes_routes.FILME_NAO_ENCONTRADO


def test_delete_filme_sem_permissao(client: TestClient) -> None:
    response = client.delete("/1")

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /search/
# ---------------------------------------------------------------------------


def test_search_filmes_por_titulo_com_resultado(
    client: TestClient, mock_db: MagicMock
) -> None:
    filme = _make_filme()
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = [filme]

    response = client.get("/search/", params={"titulo": "Inception"})

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_filmes_sem_resultado(client: TestClient, mock_db: MagicMock) -> None:
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = []

    response = client.get("/search/", params={"titulo": "Inexistente"})

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /{filme_id}/inventario
# ---------------------------------------------------------------------------


def test_update_inventario_existente(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme(copias_disponiveis=3, total_copias=5)
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    response = client.patch("/1/inventario", json={"acao": "alugar"})

    assert response.status_code == 200
    assert response.json()["copias_disponiveis"] == 2


def test_update_inventario_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.patch("/999/inventario", json={"acao": "alugar"})

    assert response.status_code == 404
    assert response.json()["detail"] == filmes_routes.FILME_NAO_ENCONTRADO
