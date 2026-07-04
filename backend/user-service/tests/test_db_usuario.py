from unittest.mock import MagicMock, patch

from app.core.db_usuario import get_db


def test_get_db_produz_sessao_e_fecha_ao_final() -> None:
    fake_session = MagicMock()

    with patch("app.core.db_usuario.SessionLocal", return_value=fake_session):
        generator = get_db()
        db = next(generator)

        assert db is fake_session
        fake_session.close.assert_not_called()

        # Consumir o generator até o fim aciona o `finally`, fechando a sessão.
        next(generator, None)

    fake_session.close.assert_called_once()


def test_get_db_fecha_sessao_mesmo_com_excecao() -> None:
    fake_session = MagicMock()

    with patch("app.core.db_usuario.SessionLocal", return_value=fake_session):
        generator = get_db()
        next(generator)
        generator.close()

    fake_session.close.assert_called_once()
