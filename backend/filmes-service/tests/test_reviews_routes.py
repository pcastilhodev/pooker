from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from app.api.v1.routes import reviews as reviews_routes
from app.core.database import get_db
from app.models.filme import Filme
from app.models.review import Review
from fastapi import FastAPI
from fastapi.testclient import TestClient

OWNER_HEADERS = {"X-User-Id": "10", "X-User-Role": "CLIENTE"}
OTHER_USER_HEADERS = {"X-User-Id": "99", "X-User-Role": "CLIENTE"}
ADMIN_HEADERS = {"X-User-Id": "1", "X-User-Role": "ADMIN"}


def _make_review(**kwargs: object) -> Review:
    defaults: dict[str, object] = dict(
        id=1,
        filme_id=1,
        usuario_id=10,
        rating=8,
        review="Ótimo filme!",
        created_at=datetime.now(UTC),
        updated_at=None,
    )
    defaults.update(kwargs)
    return Review(**defaults)


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


@pytest.fixture
def client(mock_db: MagicMock) -> TestClient:
    app = FastAPI()
    app.include_router(reviews_routes.router)
    app.dependency_overrides[get_db] = lambda: mock_db
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /
# ---------------------------------------------------------------------------


def test_create_review_sucesso(client: TestClient, mock_db: MagicMock) -> None:
    filme = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    def _refresh(obj: Review) -> None:
        obj.id = 1
        obj.created_at = datetime.now(UTC)

    mock_db.refresh.side_effect = _refresh

    payload = {"review": "Muito bom!", "rating": 9, "filme_id": 1}
    response = client.post("/", json=payload, headers=OWNER_HEADERS)

    assert response.status_code == 201
    body = response.json()
    assert body["usuario_id"] == 10
    assert mock_db.add.called
    assert mock_db.commit.called


def test_create_review_filme_inexistente(
    client: TestClient, mock_db: MagicMock
) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    payload = {"review": "Muito bom!", "rating": 9, "filme_id": 42}
    response = client.post("/", json=payload, headers=OWNER_HEADERS)

    assert response.status_code == 404
    assert "42" in response.json()["detail"]


def test_create_review_sem_headers_obrigatorios(client: TestClient) -> None:
    payload = {"review": "Muito bom!", "rating": 9, "filme_id": 1}
    response = client.post("/", json=payload)

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# GET /filme/{filme_id}
# ---------------------------------------------------------------------------


def test_get_reviews_by_filme(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review()
    mock_db.query.return_value.filter.return_value.all.return_value = [review]

    response = client.get("/filme/1")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["review"] == "Ótimo filme!"


def test_get_reviews_by_filme_vazio(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.all.return_value = []

    response = client.get("/filme/999")

    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# PUT /{review_id}
# ---------------------------------------------------------------------------


def test_update_review_pelo_dono(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    payload = {"review": "Revisado", "rating": 7}
    response = client.put("/1", json=payload, headers=OWNER_HEADERS)

    assert response.status_code == 200
    assert response.json()["review"] == "Revisado"
    mock_db.commit.assert_called_once()


def test_update_review_pelo_admin(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    payload = {"review": "Revisado pelo admin", "rating": 6}
    response = client.put("/1", json=payload, headers=ADMIN_HEADERS)

    assert response.status_code == 200
    assert response.json()["review"] == "Revisado pelo admin"


def test_update_review_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    payload = {"review": "Revisado", "rating": 7}
    response = client.put("/999", json=payload, headers=OWNER_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == "Review não encontrado."


def test_update_review_sem_permissao(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    payload = {"review": "Tentativa indevida", "rating": 1}
    response = client.put("/1", json=payload, headers=OTHER_USER_HEADERS)

    assert response.status_code == 403
    mock_db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# DELETE /{review_id}
# ---------------------------------------------------------------------------


def test_delete_review_pelo_dono(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    response = client.delete("/1", headers=OWNER_HEADERS)

    assert response.status_code == 204
    mock_db.delete.assert_called_once_with(review)


def test_delete_review_pelo_admin(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    response = client.delete("/1", headers=ADMIN_HEADERS)

    assert response.status_code == 204


def test_delete_review_inexistente(client: TestClient, mock_db: MagicMock) -> None:
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = client.delete("/999", headers=OWNER_HEADERS)

    assert response.status_code == 404
    assert response.json()["detail"] == "Review não encontrado."


def test_delete_review_sem_permissao(client: TestClient, mock_db: MagicMock) -> None:
    review = _make_review(usuario_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = review

    response = client.delete("/1", headers=OTHER_USER_HEADERS)

    assert response.status_code == 403
    mock_db.delete.assert_not_called()
