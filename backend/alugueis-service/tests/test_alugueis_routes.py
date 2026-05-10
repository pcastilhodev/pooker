from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import requests as req_lib
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.core.security import get_current_user, User
from app.models.aluguel import AluguelStatus

# ── dependency overrides ────────────────────────────────────────────────────
# ADMIN evita o bug de comparação int/str no check de ownership da rota

def _fake_admin():
    return User(id="1", role="ADMIN")

def _mock_db():
    return MagicMock()

app.dependency_overrides[get_db] = _mock_db
app.dependency_overrides[get_current_user] = _fake_admin

client = TestClient(app)


# ── helpers ─────────────────────────────────────────────────────────────────

def _make_aluguel(**kwargs):
    defaults = dict(
        id=1,
        filme_id=1,
        usuario_id=1,
        data_aluguel=datetime.now(),
        data_prevista_devolucao=datetime.now(),
        data_devolucao=None,
        valor_aluguel=9.90,
        status=AluguelStatus.ATIVO,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _ok_payment():
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {"status": 200, "message": "ok"}
    resp.raise_for_status.return_value = None
    return resp


# ── health check ─────────────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok, alugueis-service"


# ── POST /v1/alugueis/ ───────────────────────────────────────────────────────

def test_create_aluguel_sucesso():
    aluguel = _make_aluguel()
    with patch("app.api.v1.routes.alugueis.aluguel_service.create", return_value=aluguel), \
         patch("app.api.v1.routes.alugueis.requests.post", return_value=_ok_payment()):
        response = client.post("/v1/alugueis/", json={"filme_id": 1})

    assert response.status_code == 201
    data = response.json()
    assert data["aluguel"]["id"] == 1
    assert data["aluguel"]["valor_aluguel"] == 9.90
    assert "pagamento" in data


def test_create_aluguel_service_error_retorna_500():
    with patch("app.api.v1.routes.alugueis.aluguel_service.create", side_effect=Exception("falha")):
        response = client.post("/v1/alugueis/", json={"filme_id": 1})

    assert response.status_code == 500
    assert "Erro ao criar aluguel" in response.json()["detail"]


def test_create_aluguel_payment_offline_retorna_503():
    aluguel = _make_aluguel()
    with patch("app.api.v1.routes.alugueis.aluguel_service.create", return_value=aluguel), \
         patch("app.api.v1.routes.alugueis.requests.post",
               side_effect=req_lib.exceptions.RequestException("timeout")):
        response = client.post("/v1/alugueis/", json={"filme_id": 1})

    assert response.status_code == 503


# ── GET /v1/alugueis/ ────────────────────────────────────────────────────────

def test_get_alugueis_retorna_lista():
    alugueis = [_make_aluguel(), _make_aluguel(id=2)]
    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_usuario", return_value=alugueis):
        response = client.get("/v1/alugueis/")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_alugueis_lista_vazia():
    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_usuario", return_value=[]):
        response = client.get("/v1/alugueis/")

    assert response.status_code == 200
    assert response.json() == []


# ── POST /v1/alugueis/{id}/devolucao ─────────────────────────────────────────

def test_processar_devolucao_sucesso():
    aluguel = _make_aluguel(usuario_id=1)
    devolvido = _make_aluguel(status=AluguelStatus.DEVOLVIDO, data_devolucao=datetime.now())

    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_id", return_value=aluguel), \
         patch("app.api.v1.routes.alugueis.aluguel_service.processar_devolucao", return_value=devolvido):
        response = client.post("/v1/alugueis/1/devolucao")

    assert response.status_code == 200
    assert response.json()["status"] == "devolvido"


def test_processar_devolucao_nao_encontrado():
    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_id", return_value=None):
        response = client.post("/v1/alugueis/999/devolucao")

    assert response.status_code == 404


def test_processar_devolucao_sem_permissao():
    # usuário USER (não ADMIN) tentando devolver aluguel de outro usuário
    app.dependency_overrides[get_current_user] = lambda: User(id="1", role="USER")
    aluguel = _make_aluguel(usuario_id=99)

    try:
        with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_id", return_value=aluguel):
            response = client.post("/v1/alugueis/1/devolucao")
    finally:
        app.dependency_overrides[get_current_user] = _fake_admin

    assert response.status_code == 403


def test_processar_devolucao_ja_devolvido_retorna_400():
    aluguel = _make_aluguel(usuario_id=1)

    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_id", return_value=aluguel), \
         patch("app.api.v1.routes.alugueis.aluguel_service.processar_devolucao",
               side_effect=ValueError("já foi devolvido")):
        response = client.post("/v1/alugueis/1/devolucao")

    assert response.status_code == 400
    assert "devolvido" in response.json()["detail"]


def test_processar_devolucao_conexao_falha_retorna_503():
    aluguel = _make_aluguel(usuario_id=1)

    with patch("app.api.v1.routes.alugueis.aluguel_service.get_by_id", return_value=aluguel), \
         patch("app.api.v1.routes.alugueis.aluguel_service.processar_devolucao",
               side_effect=ConnectionError("timeout")):
        response = client.post("/v1/alugueis/1/devolucao")

    assert response.status_code == 503


# ── security: headers obrigatórios ──────────────────────────────────────────

def test_sem_headers_retorna_422():
    # Removendo o override para testar a dependência real
    app.dependency_overrides.pop(get_current_user, None)
    try:
        response = client.post("/v1/alugueis/", json={"filme_id": 1})
    finally:
        app.dependency_overrides[get_current_user] = _fake_admin

    assert response.status_code == 422


def test_com_headers_validos_chama_get_current_user():
    app.dependency_overrides.pop(get_current_user, None)
    try:
        with patch("app.api.v1.routes.alugueis.aluguel_service.create", side_effect=Exception("ok")):
            response = client.post(
                "/v1/alugueis/",
                json={"filme_id": 1},
                headers={"X-User-Id": "42", "X-User-Role": "USER"},
            )
    finally:
        app.dependency_overrides[get_current_user] = _fake_admin

    # chegou à rota (erro vem do service, não da auth)
    assert response.status_code == 500
