import pytest
from unittest.mock import MagicMock

from app.services.review_service import ReviewService
from app.models.review import Review as ReviewModel
from app.schemas.review import ReviewCreateSchema, ReviewUpdateSchema

service = ReviewService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_review(id: int = 1, filme_id: int = 1, usuario_id: int = 10):
    review = MagicMock(spec=ReviewModel)
    review.id = id
    review.filme_id = filme_id
    review.usuario_id = usuario_id
    review.review = "Ótimo filme!"
    review.rating = 8
    return review


# ---------------------------------------------------------------------------
# get_reviews_for_filme
# ---------------------------------------------------------------------------

def test_get_reviews_for_filme_retorna_lista(mock_db):
    expected = [_make_review(), _make_review(id=2)]
    mock_db.query.return_value.filter.return_value.all.return_value = expected

    result = service.get_reviews_for_filme(mock_db, filme_id=1)

    assert result == expected
    assert len(result) == 2


def test_get_reviews_for_filme_sem_reviews(mock_db):
    mock_db.query.return_value.filter.return_value.all.return_value = []

    result = service.get_reviews_for_filme(mock_db, filme_id=99)

    assert result == []


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------

def test_get_existente(mock_db):
    expected = _make_review()
    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = service.get(mock_db, review_id=1)

    assert result == expected


def test_get_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.get(mock_db, review_id=999)

    assert result is None


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------

def test_create_associa_usuario_id(mock_db):
    schema = ReviewCreateSchema(review="Incrível!", rating=10, filme_id=1)

    result = service.create(mock_db, schema, usuario_id=42)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    added = mock_db.add.call_args[0][0]
    assert added.usuario_id == 42
    assert added.filme_id == 1
    assert added.rating == 10
    assert added.review == "Incrível!"


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------

def test_update_existente(mock_db):
    existing = _make_review()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    update_schema = ReviewUpdateSchema(review="Review atualizada", rating=9)
    result = service.update(mock_db, review_id=1, review_update=update_schema)

    assert result is existing
    assert existing.review == "Review atualizada"
    assert existing.rating == 9
    mock_db.commit.assert_called_once()


def test_update_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    update_schema = ReviewUpdateSchema(review="X", rating=5)
    result = service.update(mock_db, review_id=999, review_update=update_schema)

    assert result is None
    mock_db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------

def test_delete_existente(mock_db):
    existing = _make_review()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    result = service.delete(mock_db, review_id=1)

    assert result is True
    mock_db.delete.assert_called_once_with(existing)
    mock_db.commit.assert_called_once()


def test_delete_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.delete(mock_db, review_id=999)

    assert result is False
    mock_db.delete.assert_not_called()
