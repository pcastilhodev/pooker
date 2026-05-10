import pytest
from unittest.mock import MagicMock, call

from app.services.filme_service import FilmeService
from app.models.filme import Filme as FilmeModel
from app.schemas.filme import FilmeCreateSchema, FilmeUpdateSchema

service = FilmeService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_filme(
    id: int = 1,
    titulo: str = "Inception",
    genero: str = "Ficção",
    total_copias: int = 5,
    copias_disponiveis: int = 3,
    preco_aluguel: float = 9.90,
):
    filme = MagicMock(spec=FilmeModel)
    filme.id = id
    filme.titulo = titulo
    filme.genero = genero
    filme.total_copias = total_copias
    filme.copias_disponiveis = copias_disponiveis
    filme.preco_aluguel = preco_aluguel
    return filme


def _create_schema(**kwargs):
    defaults = dict(
        titulo="Inception",
        genero="Ficção",
        ano=2010,
        preco_aluguel=9.90,
        total_copias=5,
    )
    defaults.update(kwargs)
    return FilmeCreateSchema(**defaults)


# ---------------------------------------------------------------------------
# get_all
# ---------------------------------------------------------------------------

def test_get_all_retorna_lista(mock_db):
    expected = [_make_filme(), _make_filme(id=2, titulo="Matrix")]
    mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = expected

    result = service.get_all(mock_db)

    assert result == expected


def test_get_all_respeita_skip_e_limit(mock_db):
    mock_db.query.return_value.offset.return_value.limit.return_value.all.return_value = []

    service.get_all(mock_db, skip=10, limit=5)

    mock_db.query.return_value.offset.assert_called_with(10)
    mock_db.query.return_value.offset.return_value.limit.assert_called_with(5)


# ---------------------------------------------------------------------------
# get
# ---------------------------------------------------------------------------

def test_get_existente(mock_db):
    expected = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = service.get(mock_db, filme_id=1)

    assert result == expected


def test_get_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.get(mock_db, filme_id=999)

    assert result is None


# ---------------------------------------------------------------------------
# create
# ---------------------------------------------------------------------------

def test_create_inicializa_copias_disponiveis(mock_db):
    schema = _create_schema(total_copias=10)

    result = service.create(mock_db, schema)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    added_filme = mock_db.add.call_args[0][0]
    assert added_filme.copias_disponiveis == 10
    assert added_filme.total_copias == 10


# ---------------------------------------------------------------------------
# update
# ---------------------------------------------------------------------------

def test_update_existente(mock_db):
    existing = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    update_schema = FilmeUpdateSchema(
        titulo="Inception 2",
        genero="Ficção",
        ano=2010,
        preco_aluguel=12.0,
        total_copias=5,
        copias_disponiveis=3,
    )
    result = service.update(mock_db, filme_id=1, filme_update=update_schema)

    assert result is existing
    assert existing.titulo == "Inception 2"
    mock_db.commit.assert_called_once()


def test_update_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    update_schema = FilmeUpdateSchema(
        titulo="X",
        genero="Y",
        ano=2020,
        preco_aluguel=1.0,
        total_copias=1,
        copias_disponiveis=1,
    )
    result = service.update(mock_db, filme_id=999, filme_update=update_schema)

    assert result is None
    mock_db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------

def test_delete_existente(mock_db):
    existing = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    result = service.delete(mock_db, filme_id=1)

    assert result is True
    mock_db.delete.assert_called_once_with(existing)
    mock_db.commit.assert_called_once()


def test_delete_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.delete(mock_db, filme_id=999)

    assert result is False
    mock_db.delete.assert_not_called()


# ---------------------------------------------------------------------------
# search
# ---------------------------------------------------------------------------

def test_search_por_titulo(mock_db):
    expected = [_make_filme()]
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = expected

    result = service.search(mock_db, titulo="Inception")

    assert result == expected


def test_search_por_genero(mock_db):
    expected = [_make_filme()]
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.all.return_value = expected

    result = service.search(mock_db, genero="Ficção")

    assert result == expected


def test_search_sem_filtros(mock_db):
    expected = [_make_filme(), _make_filme(id=2)]
    query_mock = mock_db.query.return_value
    query_mock.all.return_value = expected

    result = service.search(mock_db)

    assert result == expected
    query_mock.filter.assert_not_called()


# ---------------------------------------------------------------------------
# update_inventario
# ---------------------------------------------------------------------------

def test_update_inventario_alugar_decrementa(mock_db):
    filme = _make_filme(copias_disponiveis=3, total_copias=5)
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    result = service.update_inventario(mock_db, filme_id=1, acao="alugar")

    assert result.copias_disponiveis == 2
    mock_db.commit.assert_called_once()


def test_update_inventario_alugar_sem_copias_levanta_erro(mock_db):
    filme = _make_filme(copias_disponiveis=0, total_copias=5)
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    with pytest.raises(ValueError, match="Não há cópias disponíveis"):
        service.update_inventario(mock_db, filme_id=1, acao="alugar")

    mock_db.commit.assert_not_called()


def test_update_inventario_devolver_incrementa(mock_db):
    filme = _make_filme(copias_disponiveis=2, total_copias=5)
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    result = service.update_inventario(mock_db, filme_id=1, acao="devolver")

    assert result.copias_disponiveis == 3
    mock_db.commit.assert_called_once()


def test_update_inventario_devolver_inventario_cheio_levanta_erro(mock_db):
    filme = _make_filme(copias_disponiveis=5, total_copias=5)
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    with pytest.raises(ValueError, match="Inventário já está completo"):
        service.update_inventario(mock_db, filme_id=1, acao="devolver")

    mock_db.commit.assert_not_called()


def test_update_inventario_acao_invalida(mock_db):
    filme = _make_filme()
    mock_db.query.return_value.filter.return_value.first.return_value = filme

    with pytest.raises(ValueError, match="Ação inválida"):
        service.update_inventario(mock_db, filme_id=1, acao="destruir")


def test_update_inventario_filme_inexistente(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.update_inventario(mock_db, filme_id=999, acao="alugar")

    assert result is None
