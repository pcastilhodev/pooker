import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

HEADERS = {"X-User-Id": "1", "X-User-Role": "user"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _post_payment(payload: dict, headers: dict = HEADERS):
    return client.post("/api/v1/payment", json=payload, headers=headers)


def _ok_aluguel_response() -> MagicMock:
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {"status": "devolvido"}
    return mock


# ---------------------------------------------------------------------------
# Validação de amount
# ---------------------------------------------------------------------------

def test_amount_zero_retorna_400():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": 0.0}
    response = _post_payment(payload)
    assert response.status_code == 400
    assert "Valor inválido" in response.json()["detail"]


def test_amount_negativo_retorna_400():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": -10.0}
    response = _post_payment(payload)
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Sucesso
# ---------------------------------------------------------------------------

def test_pagamento_sucesso_com_alugueis_ok():
    payload = {"aluguel_id": 5, "user_id": 2, "amount": 19.90}

    with patch("app.routes.payment.requests.post", return_value=_ok_aluguel_response()):
        response = _post_payment(payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert data["aluguel_id"] == 5
    assert data["user_id"] == 2
    assert data["amount"] == 19.90
    assert data["message"] == "Payment processed successfully"
    assert "aluguel_update" in data


# ---------------------------------------------------------------------------
# Falhas ao chamar alugueis-service
# ---------------------------------------------------------------------------

def test_pagamento_com_alugueis_retornando_erro_inclui_warning():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": 10.0}

    mock_resp = MagicMock()
    mock_resp.status_code = 500

    with patch("app.routes.payment.requests.post", return_value=mock_resp):
        response = _post_payment(payload)

    assert response.status_code == 200
    data = response.json()
    assert "warning" in data
    assert "1" in data["warning"]


def test_pagamento_com_excecao_na_chamada_inclui_warning():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": 10.0}

    with patch("app.routes.payment.requests.post", side_effect=Exception("timeout")):
        response = _post_payment(payload)

    assert response.status_code == 200
    data = response.json()
    assert "warning" in data
    assert "timeout" in data["warning"]


# ---------------------------------------------------------------------------
# Headers obrigatórios
# ---------------------------------------------------------------------------

def test_sem_header_x_user_id_retorna_422():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": 10.0}
    response = client.post("/api/v1/payment", json=payload, headers={"X-User-Role": "user"})
    assert response.status_code == 422


def test_sem_header_x_user_role_retorna_422():
    payload = {"aluguel_id": 1, "user_id": 1, "amount": 10.0}
    response = client.post("/api/v1/payment", json=payload, headers={"X-User-Id": "1"})
    assert response.status_code == 422
