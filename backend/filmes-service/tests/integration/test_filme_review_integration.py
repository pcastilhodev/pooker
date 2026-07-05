"""Testes de integração de FilmeService e ReviewService contra um Postgres
real, sem nenhum mock de banco (ao contrário dos testes unitários existentes,
que usam MagicMock no lugar da sessão). Cobrem o ciclo de vida completo dos
registros e o comportamento das constraints reais da tabela.
"""

import pytest
from app.schemas.filme import FilmeCreateSchema, FilmeUpdateSchema
from app.schemas.review import ReviewCreateSchema, ReviewUpdateSchema
from app.services.filme_service import FilmeService
from app.services.review_service import ReviewService

pytestmark = pytest.mark.integration


def _filme_payload(**overrides: object) -> FilmeCreateSchema:
    defaults: dict[str, object] = dict(
        titulo="Matrix",
        genero="Ficção",
        ano=1999,
        preco_aluguel=5.5,
        total_copias=4,
    )
    defaults.update(overrides)
    return FilmeCreateSchema(**defaults)


class TestFilmeServiceIntegration:
    def test_create_e_get_persistem_filme_no_banco_real(self, db_session):
        service = FilmeService()

        criado = service.create(db_session, _filme_payload())
        assert criado.id is not None
        assert criado.copias_disponiveis == criado.total_copias

        obtido = service.get(db_session, criado.id)
        assert obtido is not None
        assert obtido.titulo == "Matrix"

    def test_update_altera_campos_persistidos(self, db_session):
        service = FilmeService()
        criado = service.create(db_session, _filme_payload(titulo="Inception"))

        atualizado = service.update(
            db_session,
            criado.id,
            FilmeUpdateSchema(
                titulo="Inception (Dublado)",
                genero="Ficção",
                ano=2010,
                preco_aluguel=6.0,
                total_copias=4,
                copias_disponiveis=4,
            ),
        )

        assert atualizado is not None
        assert atualizado.titulo == "Inception (Dublado)"
        assert service.get(db_session, criado.id).titulo == "Inception (Dublado)"

    def test_delete_remove_filme_do_banco(self, db_session):
        service = FilmeService()
        criado = service.create(db_session, _filme_payload(titulo="Titanic"))

        assert service.delete(db_session, criado.id) is True
        assert service.get(db_session, criado.id) is None

    def test_search_filtra_por_titulo_e_genero(self, db_session):
        service = FilmeService()
        service.create(db_session, _filme_payload(titulo="Matrix", genero="Ficção"))
        service.create(db_session, _filme_payload(titulo="Matrix Reloaded", genero="Ficção"))
        service.create(db_session, _filme_payload(titulo="Titanic", genero="Drama"))

        por_titulo = service.search(db_session, titulo="matrix")
        por_genero = service.search(db_session, genero="drama")

        assert {f.titulo for f in por_titulo} == {"Matrix", "Matrix Reloaded"}
        assert {f.titulo for f in por_genero} == {"Titanic"}

    def test_update_inventario_alugar_e_devolver(self, db_session):
        service = FilmeService()
        criado = service.create(db_session, _filme_payload(total_copias=2))

        alugado = service.update_inventario(db_session, criado.id, "alugar")
        assert alugado.copias_disponiveis == 1

        devolvido = service.update_inventario(db_session, criado.id, "devolver")
        assert devolvido.copias_disponiveis == 2

    def test_update_inventario_sem_copias_disponiveis_gera_erro(self, db_session):
        service = FilmeService()
        criado = service.create(db_session, _filme_payload(total_copias=1))
        service.update_inventario(db_session, criado.id, "alugar")

        with pytest.raises(ValueError):
            service.update_inventario(db_session, criado.id, "alugar")


class TestReviewServiceIntegration:
    def test_create_e_listagem_de_reviews_por_filme(self, db_session):
        filme_service = FilmeService()
        review_service = ReviewService()
        filme = filme_service.create(db_session, _filme_payload(titulo="Duna"))

        review_service.create(
            db_session,
            ReviewCreateSchema(review="Otimo filme", rating=9, filme_id=filme.id),
            usuario_id=1,
        )
        review_service.create(
            db_session,
            ReviewCreateSchema(review="Mediano", rating=6, filme_id=filme.id),
            usuario_id=2,
        )

        reviews = review_service.get_reviews_for_filme(db_session, filme.id)
        assert len(reviews) == 2
        assert {r.usuario_id for r in reviews} == {1, 2}

    def test_update_review_altera_nota_persistida(self, db_session):
        filme_service = FilmeService()
        review_service = ReviewService()
        filme = filme_service.create(db_session, _filme_payload(titulo="Duna"))
        review = review_service.create(
            db_session,
            ReviewCreateSchema(review="Ok", rating=5, filme_id=filme.id),
            usuario_id=3,
        )

        atualizada = review_service.update(
            db_session, review.id, ReviewUpdateSchema(review="Revi e adorei", rating=10)
        )

        assert atualizada is not None
        assert atualizada.rating == 10
        assert review_service.get(db_session, review.id).review == "Revi e adorei"

    def test_delete_review_remove_do_banco(self, db_session):
        filme_service = FilmeService()
        review_service = ReviewService()
        filme = filme_service.create(db_session, _filme_payload(titulo="Duna"))
        review = review_service.create(
            db_session,
            ReviewCreateSchema(review="Removivel", rating=4, filme_id=filme.id),
            usuario_id=4,
        )

        assert review_service.delete(db_session, review.id) is True
        assert review_service.get(db_session, review.id) is None
