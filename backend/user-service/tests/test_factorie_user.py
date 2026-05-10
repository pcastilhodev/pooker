from unittest.mock import patch

from app.factorie.factorie_user import UserFactory
from app.dtos.dto_user import UserDTO
from app.models.models_user import User

FAKE_HASH = "$2b$12$fakehashfortesting"


def _valid_dto(**overrides) -> UserDTO:
    base = dict(
        nome="João Silva",
        cpf="12345678901",
        email="joao@example.com",
        senha="senha123456",
        role="user",
    )
    base.update(overrides)
    return UserDTO(**base)


# ---------------------------------------------------------------------------
# UserFactory.create
# ---------------------------------------------------------------------------

def test_create_retorna_instancia_user():
    with patch("app.factorie.factorie_user.pwd_context.hash", return_value=FAKE_HASH):
        result = UserFactory.create(_valid_dto())

    assert isinstance(result, User)


def test_create_copia_campos_do_dto():
    dto = _valid_dto(nome="Maria", email="maria@example.com", cpf="98765432100")

    with patch("app.factorie.factorie_user.pwd_context.hash", return_value=FAKE_HASH):
        result = UserFactory.create(dto)

    assert result.nome == "Maria"
    assert result.email == "maria@example.com"
    assert result.cpf == "98765432100"
    assert result.role == "user"


def test_create_senha_e_hasheada():
    with patch("app.factorie.factorie_user.pwd_context.hash", return_value=FAKE_HASH) as mock_hash:
        result = UserFactory.create(_valid_dto(senha="senha_original"))

    mock_hash.assert_called_once_with("senha_original")
    assert result.senha == FAKE_HASH
    assert result.senha != "senha_original"


def test_create_senhas_diferentes_geram_hashes_diferentes():
    hashes = ["$2b$hash_a", "$2b$hash_b"]

    with patch("app.factorie.factorie_user.pwd_context.hash", side_effect=hashes):
        result1 = UserFactory.create(_valid_dto(senha="senha_a_12345"))
        result2 = UserFactory.create(_valid_dto(senha="senha_b_67890"))

    assert result1.senha != result2.senha
    assert result1.senha == "$2b$hash_a"
    assert result2.senha == "$2b$hash_b"
