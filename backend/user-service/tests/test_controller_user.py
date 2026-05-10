import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.controllers.controller_user import (
    create_user,
    list_users,
    obter_user,
    update_user,
    delete_user,
    get_user_by_email,
    get_password_hash,
)
from app.schemas.schemas_user import UserCreate
from app.models.models_user import User, RoleEnum

FAKE_HASH = "$2b$12$fakehashfortesting"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_schema(**overrides) -> UserCreate:
    base = dict(
        nome="João Silva",
        cpf="12345678901",
        email="joao@example.com",
        senha="senha12345",
        role=RoleEnum.user,
    )
    base.update(overrides)
    return UserCreate(**base)


def _make_user(id: int = 1, email: str = "joao@example.com") -> MagicMock:
    user = MagicMock(spec=User)
    user.id = id
    user.email = email
    user.nome = "João Silva"
    user.cpf = "12345678901"
    return user


# ---------------------------------------------------------------------------
# get_password_hash
# ---------------------------------------------------------------------------

def test_get_password_hash_delega_ao_contexto():
    with patch("app.controllers.controller_user.pwd_context.hash", return_value=FAKE_HASH) as mock_hash:
        result = get_password_hash("minha_senha")

    mock_hash.assert_called_once_with("minha_senha")
    assert result == FAKE_HASH


def test_get_password_hash_retorna_string_nao_vazia():
    with patch("app.controllers.controller_user.pwd_context.hash", return_value=FAKE_HASH):
        result = get_password_hash("qualquer_senha")

    assert isinstance(result, str)
    assert len(result) > 0


# ---------------------------------------------------------------------------
# create_user
# ---------------------------------------------------------------------------

def test_create_user_email_novo(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with patch("app.factorie.factorie_user.pwd_context.hash", return_value=FAKE_HASH):
        result = create_user(mock_db, _valid_schema())

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    assert isinstance(result, User)
    assert result.email == "joao@example.com"


def test_create_user_email_duplicado_levanta_http_400(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = _make_user()

    with pytest.raises(HTTPException) as exc_info:
        create_user(mock_db, _valid_schema())

    assert exc_info.value.status_code == 400
    assert "Email já cadastrado" in exc_info.value.detail


# ---------------------------------------------------------------------------
# list_users
# ---------------------------------------------------------------------------

def test_list_users_retorna_todos(mock_db):
    expected = [_make_user(), _make_user(id=2, email="outro@example.com")]
    mock_db.query.return_value.all.return_value = expected

    result = list_users(mock_db)

    assert result == expected


def test_list_users_vazio(mock_db):
    mock_db.query.return_value.all.return_value = []

    result = list_users(mock_db)

    assert result == []


# ---------------------------------------------------------------------------
# obter_user
# ---------------------------------------------------------------------------

def test_obter_user_existente(mock_db):
    expected = _make_user()
    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = obter_user(mock_db, user_id=1)

    assert result == expected


def test_obter_user_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = obter_user(mock_db, user_id=999)

    assert result is None


# ---------------------------------------------------------------------------
# update_user
# ---------------------------------------------------------------------------

def test_update_user_existente(mock_db):
    existing = _make_user()
    mock_db.query.return_value.filter.return_value.first.return_value = existing
    schema = _valid_schema(nome="Novo Nome", email="novo@example.com")

    with patch("app.controllers.controller_user.pwd_context.hash", return_value=FAKE_HASH):
        result = update_user(mock_db, user_id=1, data=schema)

    assert result is existing
    assert existing.nome == "Novo Nome"
    assert existing.email == "novo@example.com"
    assert existing.senha == FAKE_HASH
    mock_db.commit.assert_called_once()


def test_update_user_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = update_user(mock_db, user_id=999, data=_valid_schema())

    assert result is None
    mock_db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# delete_user
# ---------------------------------------------------------------------------

def test_delete_user_existente(mock_db):
    existing = _make_user()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    result = delete_user(mock_db, user_id=1)

    assert result is existing
    mock_db.delete.assert_called_once_with(existing)
    mock_db.commit.assert_called_once()


def test_delete_user_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = delete_user(mock_db, user_id=999)

    assert result is None
    mock_db.delete.assert_not_called()


# ---------------------------------------------------------------------------
# get_user_by_email
# ---------------------------------------------------------------------------

def test_get_user_by_email_existente(mock_db):
    expected = _make_user(email="found@example.com")
    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = get_user_by_email(mock_db, email="found@example.com")

    assert result == expected


def test_get_user_by_email_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = get_user_by_email(mock_db, email="ghost@example.com")

    assert result is None
