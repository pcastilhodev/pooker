"""Testes de integração do controller_user contra um Postgres real, sem
mock de banco — cobrem criação, unicidade de e-mail, atualização e remoção
de usuários diretamente na tabela ``tb_usuarios``.
"""

import pytest
from app.controllers import controller_user
from app.schemas.schemas_user import UserCreate
from fastapi import HTTPException

pytestmark = pytest.mark.integration


def _user_payload(**overrides: object) -> UserCreate:
    defaults: dict[str, object] = dict(
        nome="Fulano de Tal",
        cpf="12345678900",
        email="fulano@example.com",
        senha="senha123",
        telefone="11999999999",
    )
    defaults.update(overrides)
    return UserCreate(**defaults)


class TestUserIntegration:
    def test_create_user_persiste_no_banco_real(self, db_session):
        criado = controller_user.create_user(db_session, _user_payload())

        assert criado.id is not None
        assert criado.senha != "senha123"  # a senha é armazenada com hash

        obtido = controller_user.obter_user(db_session, criado.id)
        assert obtido is not None
        assert obtido.email == "fulano@example.com"

    def test_create_user_com_email_duplicado_gera_erro(self, db_session):
        controller_user.create_user(db_session, _user_payload(email="duplicado@example.com"))

        with pytest.raises(HTTPException) as exc_info:
            controller_user.create_user(
                db_session, _user_payload(cpf="00000000000", email="duplicado@example.com")
            )

        assert exc_info.value.status_code == 400

    def test_update_user_altera_campos_persistidos(self, db_session):
        criado = controller_user.create_user(
            db_session, _user_payload(email="original@example.com")
        )

        atualizado = controller_user.update_user(
            db_session,
            criado.id,
            _user_payload(nome="Nome Novo", email="original@example.com"),
        )

        assert atualizado is not None
        assert atualizado.nome == "Nome Novo"
        assert controller_user.obter_user(db_session, criado.id).nome == "Nome Novo"

    def test_delete_user_remove_do_banco(self, db_session):
        criado = controller_user.create_user(
            db_session, _user_payload(email="remover@example.com")
        )

        removido = controller_user.delete_user(db_session, criado.id)

        assert removido is not None
        assert controller_user.obter_user(db_session, criado.id) is None

    def test_get_user_by_email_encontra_usuario_persistido(self, db_session):
        controller_user.create_user(db_session, _user_payload(email="busca@example.com"))

        encontrado = controller_user.get_user_by_email(db_session, "busca@example.com")

        assert encontrado is not None
        assert encontrado.email == "busca@example.com"

    def test_list_users_retorna_todos_os_persistidos(self, db_session):
        controller_user.create_user(db_session, _user_payload(email="a@example.com"))
        controller_user.create_user(
            db_session, _user_payload(cpf="99999999999", email="b@example.com")
        )

        usuarios = controller_user.list_users(db_session)

        assert {u.email for u in usuarios} == {"a@example.com", "b@example.com"}
