import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

import httpx

from app.services.aluguel_service import AluguelService
from app.models.aluguel import Aluguel as AluguelModel, AluguelStatus
from app.schemas.aluguel import AluguelCreateSchema

service = AluguelService()
FILMES_URL = "http://filmes-service:8003"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_response(json_data: dict, status_code: int = 200):
    mock = MagicMock()
    mock.json.return_value = json_data
    mock.status_code = status_code
    mock.raise_for_status.return_value = None
    return mock


def _make_aluguel(status: AluguelStatus = AluguelStatus.ATIVO, filme_id: int = 1):
    aluguel = MagicMock(spec=AluguelModel)
    aluguel.id = 1
    aluguel.filme_id = filme_id
    aluguel.status = status
    aluguel.data_devolucao = None
    return aluguel


# ---------------------------------------------------------------------------
# get_by_usuario
# ---------------------------------------------------------------------------

def test_get_by_usuario_retorna_lista(mock_db):
    expected = [_make_aluguel()]
    mock_db.query.return_value.filter.return_value.all.return_value = expected

    result = service.get_by_usuario(mock_db, usuario_id=1)

    assert result == expected


# ---------------------------------------------------------------------------
# get_by_id
# ---------------------------------------------------------------------------

def test_get_by_id_existente(mock_db):
    expected = _make_aluguel()
    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = service.get_by_id(mock_db, aluguel_id=1)

    assert result == expected


def test_get_by_id_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.get_by_id(mock_db, aluguel_id=999)

    assert result is None


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------

def test_create_sucesso(mock_db):
    filme_resp = _make_response({"copias_disponiveis": 2, "preco_aluguel": 9.90})
    inv_resp = _make_response({"copias_disponiveis": 1})
    schema = AluguelCreateSchema(filme_id=1)

    with patch("httpx.get", return_value=filme_resp), \
         patch("httpx.patch", return_value=inv_resp):
        result = service.create(mock_db, schema, usuario_id=42)

    assert result.status == AluguelStatus.ATIVO
    assert result.valor_aluguel == 9.90
    assert result.filme_id == 1
    assert result.usuario_id == 42
    mock_db.commit.assert_called_once()
    mock_db.add.assert_called_once()


def test_create_sem_copias_disponiveis(mock_db):
    filme_resp = _make_response({"copias_disponiveis": 0, "preco_aluguel": 9.90})
    schema = AluguelCreateSchema(filme_id=1)

    with patch("httpx.get", return_value=filme_resp):
        with pytest.raises(ValueError, match="sem cópias"):
            service.create(mock_db, schema, usuario_id=1)

    mock_db.commit.assert_not_called()


def test_create_filme_nao_encontrado(mock_db):
    mock_resp = MagicMock()
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Not Found",
        request=MagicMock(),
        response=MagicMock(status_code=404),
    )
    schema = AluguelCreateSchema(filme_id=99)

    with patch("httpx.get", return_value=mock_resp):
        with pytest.raises(ValueError, match="não encontrado"):
            service.create(mock_db, schema, usuario_id=1)


def test_create_filmes_service_offline(mock_db):
    schema = AluguelCreateSchema(filme_id=1)

    with patch("httpx.get", side_effect=httpx.RequestError("connection refused")):
        with pytest.raises(ConnectionError, match="comunicar com o serviço de filmes"):
            service.create(mock_db, schema, usuario_id=1)


def test_create_patch_inventario_falha_faz_rollback(mock_db):
    filme_resp = _make_response({"copias_disponiveis": 2, "preco_aluguel": 9.90})
    schema = AluguelCreateSchema(filme_id=1)

    with patch("httpx.get", return_value=filme_resp), \
         patch("httpx.patch", side_effect=httpx.RequestError("timeout")):
        with pytest.raises(ConnectionError, match="atualizar o inventário"):
            service.create(mock_db, schema, usuario_id=1)

    mock_db.rollback.assert_called_once()
    mock_db.commit.assert_not_called()


def test_create_patch_inventario_retorna_erro_http(mock_db):
    filme_resp = _make_response({"copias_disponiveis": 2, "preco_aluguel": 9.90})
    patch_resp = MagicMock()
    patch_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Unprocessable",
        request=MagicMock(),
        response=MagicMock(text="sem cópias"),
    )
    schema = AluguelCreateSchema(filme_id=1)

    with patch("httpx.get", return_value=filme_resp), \
         patch("httpx.patch", return_value=patch_resp):
        with pytest.raises(ValueError, match="inventário"):
            service.create(mock_db, schema, usuario_id=1)

    mock_db.rollback.assert_called_once()


# ---------------------------------------------------------------------------
# processar_devolucao
# ---------------------------------------------------------------------------

def test_processar_devolucao_id_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.processar_devolucao(mock_db, aluguel_id=999)

    assert result is None


def test_processar_devolucao_ja_devolvido(mock_db):
    aluguel = _make_aluguel(status=AluguelStatus.DEVOLVIDO)
    mock_db.query.return_value.filter.return_value.first.return_value = aluguel

    with pytest.raises(ValueError, match="já foi devolvido"):
        service.processar_devolucao(mock_db, aluguel_id=1)


def test_processar_devolucao_sucesso(mock_db):
    aluguel = _make_aluguel(status=AluguelStatus.ATIVO, filme_id=1)
    mock_db.query.return_value.filter.return_value.first.return_value = aluguel
    inv_resp = _make_response({"copias_disponiveis": 2})

    with patch("httpx.patch", return_value=inv_resp):
        result = service.processar_devolucao(mock_db, aluguel_id=1)

    assert result.status == AluguelStatus.DEVOLVIDO
    assert result.data_devolucao is not None
    mock_db.commit.assert_called_once()


def test_processar_devolucao_patch_falha(mock_db):
    aluguel = _make_aluguel(status=AluguelStatus.ATIVO, filme_id=1)
    mock_db.query.return_value.filter.return_value.first.return_value = aluguel

    with patch("httpx.patch", side_effect=httpx.RequestError("timeout")):
        with pytest.raises(ConnectionError, match="devolver o filme"):
            service.processar_devolucao(mock_db, aluguel_id=1)


def test_processar_devolucao_patch_retorna_erro_http(mock_db):
    aluguel = _make_aluguel(status=AluguelStatus.ATIVO, filme_id=1)
    mock_db.query.return_value.filter.return_value.first.return_value = aluguel

    patch_resp = MagicMock()
    patch_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Unprocessable",
        request=MagicMock(),
        response=MagicMock(text="inventario cheio"),
    )

    with patch("httpx.patch", return_value=patch_resp):
        with pytest.raises(ValueError, match="inventário na devolução"):
            service.processar_devolucao(mock_db, aluguel_id=1)
