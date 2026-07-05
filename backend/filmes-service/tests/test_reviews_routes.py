from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.core.security import get_current_user, User

app.dependency_overrides[get_db] = lambda: MagicMock()

client = TestClient(app)


def _make_review(**kwargs):
    defaults = dict(
        id=1,
        filme_id=1,
        usuario_id=1,
        review="Ótimo filme",
        rating=9,
        created_at=datetime.now(),
        updated_at=None,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _make_filme(**kwargs):
    defaults = dict(id=1, titulo="Matrix")
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _override_user(role="USER", user_id=1):
    app.dependency_overrides[get_current_user] = lambda: User(id=user_id, role=role)


def _reset_user_override():
    app.dependency_overrides.pop(get_current_user, None)


def test_create_review_sucesso():
    _override_user()
    try:
        with patch("app.api.v1.routes.reviews.filme_service.get", return_value=_make_filme()), \
             patch("app.api.v1.routes.reviews.review_service.create", return_value=_make_review()):
            response = client.post("/v1/reviews/", json={"filme_id": 1, "review": "Ótimo filme", "rating": 9})
    finally:
        _reset_user_override()

    assert response.status_code == 201
    assert response.json()["rating"] == 9


def test_create_review_filme_nao_encontrado():
    _override_user()
    try:
        with patch("app.api.v1.routes.reviews.filme_service.get", return_value=None):
            response = client.post("/v1/reviews/", json={"filme_id": 999, "review": "x", "rating": 5})
    finally:
        _reset_user_override()

    assert response.status_code == 404


def test_get_reviews_by_filme():
    with patch("app.api.v1.routes.reviews.review_service.get_reviews_for_filme", return_value=[_make_review()]):
        response = client.get("/v1/reviews/filme/1")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_update_review_owner_sucesso():
    _override_user(role="USER", user_id=1)
    try:
        review = _make_review(usuario_id=1)
        atualizado = _make_review(usuario_id=1, review="Atualizado", rating=7)
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=review), \
             patch("app.api.v1.routes.reviews.review_service.update", return_value=atualizado):
            response = client.put("/v1/reviews/1", json={"review": "Atualizado", "rating": 7})
    finally:
        _reset_user_override()

    assert response.status_code == 200
    assert response.json()["review"] == "Atualizado"


def test_update_review_nao_encontrado():
    _override_user()
    try:
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=None):
            response = client.put("/v1/reviews/999", json={"review": "x", "rating": 5})
    finally:
        _reset_user_override()

    assert response.status_code == 404


def test_update_review_sem_permissao():
    _override_user(role="USER", user_id=2)
    try:
        review = _make_review(usuario_id=1)
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=review):
            response = client.put("/v1/reviews/1", json={"review": "x", "rating": 5})
    finally:
        _reset_user_override()

    assert response.status_code == 403


def test_delete_review_admin_sucesso():
    _override_user(role="ADMIN", user_id=99)
    try:
        review = _make_review(usuario_id=1)
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=review), \
             patch("app.api.v1.routes.reviews.review_service.delete", return_value=None):
            response = client.delete("/v1/reviews/1")
    finally:
        _reset_user_override()

    assert response.status_code == 204


def test_delete_review_nao_encontrado():
    _override_user()
    try:
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=None):
            response = client.delete("/v1/reviews/999")
    finally:
        _reset_user_override()

    assert response.status_code == 404


def test_delete_review_sem_permissao():
    _override_user(role="USER", user_id=2)
    try:
        review = _make_review(usuario_id=1)
        with patch("app.api.v1.routes.reviews.review_service.get", return_value=review):
            response = client.delete("/v1/reviews/1")
    finally:
        _reset_user_override()

    assert response.status_code == 403
