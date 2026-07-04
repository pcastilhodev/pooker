from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.db_usuario import get_db
from app.models.models_user import RoleEnum
from app.routes.routes import api_router

FAKE_HASH = "$2b$12$fakehashfortesting"


def _user_obj(
    id: int = 1,
    email: str = "joao@example.com",
    role: RoleEnum = RoleEnum.user,
    senha: str = FAKE_HASH,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=id,
        nome="João Silva",
        cpf="12345678901",
        email=email,
        senha=senha,
        telefone=None,
        data_nascimento=None,
        role=role,
    )


def _valid_payload(**overrides: object) -> dict:
    base = dict(
        nome="João Silva",
        cpf="12345678901",
        email="joao@example.com",
        senha="senha12345",
        role="user",
    )
    base.update(overrides)
    return base


@pytest.fixture
def db_mock() -> MagicMock:
    return MagicMock()


@pytest.fixture
def client(db_mock: MagicMock) -> TestClient:
    app = FastAPI()
    app.include_router(api_router, prefix="/api/v1")
    app.dependency_overrides[get_db] = lambda: db_mock
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /users/ (create_user)
# ---------------------------------------------------------------------------


def test_create_user_sucesso(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = None
    # db.refresh(new_user) normalmente preencheria o id gerado pelo banco;
    # como o db é um mock, simulamos esse comportamento aqui.
    db_mock.refresh.side_effect = lambda obj: setattr(obj, "id", 1)

    with patch(
        "app.factorie.factorie_user.pwd_context.hash", return_value=FAKE_HASH
    ):
        resp = client.post("/api/v1/users/", json=_valid_payload())

    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "joao@example.com"
    db_mock.add.assert_called_once()
    db_mock.commit.assert_called_once()


def test_create_user_email_duplicado(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()

    resp = client.post("/api/v1/users/", json=_valid_payload())

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email já cadastrado"


# ---------------------------------------------------------------------------
# GET /users/ (list_users)
# ---------------------------------------------------------------------------


def test_list_users_vazio(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.all.return_value = []

    resp = client.get("/api/v1/users/")

    assert resp.status_code == 200
    assert resp.json() == []


def test_list_users_com_dados(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.all.return_value = [
        _user_obj(id=1, email="a@example.com"),
        _user_obj(id=2, email="b@example.com"),
    ]

    resp = client.get("/api/v1/users/")

    assert resp.status_code == 200
    assert [u["email"] for u in resp.json()] == ["a@example.com", "b@example.com"]


# ---------------------------------------------------------------------------
# GET /users/{user_id} (get_user)
# ---------------------------------------------------------------------------


def test_get_user_existente(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj(
        role=RoleEnum.admin
    )

    resp = client.get("/api/v1/users/1")

    assert resp.status_code == 200
    assert resp.json()["email"] == "joao@example.com"
    assert resp.headers["X-User-Role"] == "admin"


def test_get_user_inexistente(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = None

    resp = client.get("/api/v1/users/999")

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Usuário não encontrado"


# ---------------------------------------------------------------------------
# POST /users/login (login_user)
# ---------------------------------------------------------------------------


def test_login_email_nao_encontrado(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = None

    resp = client.post(
        "/api/v1/users/login", json={"email": "ghost@example.com", "senha": "x"}
    )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email ou senha inválidos"


def test_login_senha_invalida(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()

    with patch(
        "app.routes.endpoints.user.pwd_context.verify", return_value=False
    ):
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "joao@example.com", "senha": "errada"},
        )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email ou senha inválidos"


def test_login_auth_service_recusa_com_detail(
    client: TestClient, db_mock: MagicMock
) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()
    fake_response = MagicMock()
    fake_response.ok = False
    fake_response.json.return_value = {"detail": "Credenciais inválidas no Auth"}

    with patch(
        "app.routes.endpoints.user.pwd_context.verify", return_value=True
    ), patch(
        "app.routes.endpoints.user.requests.post", return_value=fake_response
    ):
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "joao@example.com", "senha": "senha12345"},
        )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Credenciais inválidas no Auth"


def test_login_auth_service_recusa_sem_detail_json(
    client: TestClient, db_mock: MagicMock
) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()
    fake_response = MagicMock()
    fake_response.ok = False
    fake_response.json.side_effect = ValueError("invalid json")

    with patch(
        "app.routes.endpoints.user.pwd_context.verify", return_value=True
    ), patch(
        "app.routes.endpoints.user.requests.post", return_value=fake_response
    ):
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "joao@example.com", "senha": "senha12345"},
        )

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Falha ao autenticar no Auth Service"


def test_login_auth_service_indisponivel(
    client: TestClient, db_mock: MagicMock
) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()

    with patch(
        "app.routes.endpoints.user.pwd_context.verify", return_value=True
    ), patch(
        "app.routes.endpoints.user.requests.post",
        side_effect=ConnectionError("boom"),
    ):
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "joao@example.com", "senha": "senha12345"},
        )

    assert resp.status_code == 500
    assert "Erro ao conectar com Auth Service" in resp.json()["detail"]


def test_login_sucesso(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = _user_obj()
    fake_response = MagicMock()
    fake_response.ok = True
    fake_response.json.return_value = {"token": "jwt-fake-token"}

    with patch(
        "app.routes.endpoints.user.pwd_context.verify", return_value=True
    ), patch(
        "app.routes.endpoints.user.requests.post", return_value=fake_response
    ):
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "joao@example.com", "senha": "senha12345"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["token"] == "jwt-fake-token"
    assert body["user"]["email"] == "joao@example.com"


# ---------------------------------------------------------------------------
# PUT /users/{user_id} (update_user)
# ---------------------------------------------------------------------------


def test_update_user_existente(client: TestClient, db_mock: MagicMock) -> None:
    existing = _user_obj()
    db_mock.query.return_value.filter.return_value.first.return_value = existing

    with patch(
        "app.controllers.controller_user.pwd_context.hash", return_value=FAKE_HASH
    ):
        resp = client.put(
            "/api/v1/users/1",
            json=_valid_payload(nome="Novo Nome", email="novo@example.com"),
        )

    assert resp.status_code == 200
    assert resp.json()["nome"] == "Novo Nome"
    db_mock.commit.assert_called_once()


def test_update_user_inexistente(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = None

    resp = client.put("/api/v1/users/999", json=_valid_payload())

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Usuário não encontrado para atualização"


# ---------------------------------------------------------------------------
# DELETE /users/{user_id} (delete_user)
# ---------------------------------------------------------------------------


def test_delete_user_existente(client: TestClient, db_mock: MagicMock) -> None:
    existing = _user_obj()
    db_mock.query.return_value.filter.return_value.first.return_value = existing

    resp = client.delete("/api/v1/users/1")

    assert resp.status_code == 200
    assert resp.json() == {"detail": "Usuário deletado com sucesso"}
    db_mock.delete.assert_called_once_with(existing)


def test_delete_user_inexistente(client: TestClient, db_mock: MagicMock) -> None:
    db_mock.query.return_value.filter.return_value.first.return_value = None

    resp = client.delete("/api/v1/users/999")

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Usuário não encontrado para exclusão"
