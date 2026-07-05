"""Testes de integração do AluguelService contra um Postgres real.

Diferente dos testes unitários (que usam MagicMock no lugar da sessão do
banco), aqui a sessão é uma conexão real com Postgres: os testes validam que
o mapeamento ORM, o enum de status e as constraints da tabela `alugueis`
funcionam de ponta a ponta. A única coisa mockada é a chamada HTTP para o
filmes-service, que é uma dependência externa e não faz parte do que este
teste de integração se propõe a cobrir.
"""

from unittest.mock import MagicMock, patch

import pytest
from app.models.aluguel import AluguelStatus
from app.schemas.aluguel import AluguelCreateSchema
from app.services.aluguel_service import AluguelService

pytestmark = pytest.mark.integration


def _fake_filme_response(preco_aluguel: float = 25.0, copias_disponiveis: int = 3) -> MagicMock:
    response = MagicMock()
    response.raise_for_status = MagicMock()
    response.json.return_value = {
        "preco_aluguel": preco_aluguel,
        "copias_disponiveis": copias_disponiveis,
    }
    return response


def _fake_patch_response() -> MagicMock:
    response = MagicMock()
    response.raise_for_status = MagicMock()
    return response


class TestAluguelServiceIntegration:
    def test_create_persiste_aluguel_no_banco_real(self, db_session):
        service = AluguelService()

        with (
            patch(
                "app.services.aluguel_service.httpx.get",
                return_value=_fake_filme_response(),
            ),
            patch(
                "app.services.aluguel_service.httpx.patch",
                return_value=_fake_patch_response(),
            ),
        ):
            aluguel = service.create(
                db=db_session,
                aluguel=AluguelCreateSchema(filme_id=1),
                usuario_id=42,
            )

        assert aluguel.id is not None
        assert aluguel.status == AluguelStatus.ATIVO
        assert aluguel.valor_aluguel == 25.0

        persisted = service.get_by_id(db_session, aluguel.id)
        assert persisted is not None
        assert persisted.usuario_id == 42
        assert persisted.filme_id == 1

    def test_get_by_usuario_enriched_retorna_dados_persistidos(self, db_session):
        service = AluguelService()
        with (
            patch(
                "app.services.aluguel_service.httpx.get",
                return_value=_fake_filme_response(preco_aluguel=10.0),
            ),
            patch(
                "app.services.aluguel_service.httpx.patch",
                return_value=_fake_patch_response(),
            ),
        ):
            service.create(db_session, AluguelCreateSchema(filme_id=7), usuario_id=99)

        resultado = service.get_by_usuario_enriched(db_session, usuario_id=99)

        assert len(resultado) == 1
        assert resultado[0]["filme_id"] == 7
        assert resultado[0]["valor_aluguel"] == 10.0

    def test_processar_devolucao_atualiza_status_e_data(self, db_session):
        service = AluguelService()
        with (
            patch(
                "app.services.aluguel_service.httpx.get",
                return_value=_fake_filme_response(),
            ),
            patch(
                "app.services.aluguel_service.httpx.patch",
                return_value=_fake_patch_response(),
            ),
        ):
            aluguel = service.create(
                db_session, AluguelCreateSchema(filme_id=3), usuario_id=1
            )

            devolvido = service.processar_devolucao(db_session, aluguel.id)

        assert devolvido is not None
        assert devolvido.status == AluguelStatus.DEVOLVIDO
        assert devolvido.data_devolucao is not None

    def test_processar_devolucao_ja_devolvido_gera_erro(self, db_session):
        service = AluguelService()
        with (
            patch(
                "app.services.aluguel_service.httpx.get",
                return_value=_fake_filme_response(),
            ),
            patch(
                "app.services.aluguel_service.httpx.patch",
                return_value=_fake_patch_response(),
            ),
        ):
            aluguel = service.create(
                db_session, AluguelCreateSchema(filme_id=4), usuario_id=2
            )
            service.processar_devolucao(db_session, aluguel.id)

            with pytest.raises(ValueError):
                service.processar_devolucao(db_session, aluguel.id)

    def test_processar_devolucao_aluguel_inexistente_retorna_none(self, db_session):
        service = AluguelService()
        assert service.processar_devolucao(db_session, aluguel_id=999999) is None
