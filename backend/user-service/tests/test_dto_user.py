import pytest
from pydantic import ValidationError
from datetime import date

from app.dtos.dto_user import UserDTO
from app.schemas.schemas_user import UserCreate
from app.models.models_user import RoleEnum


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_data(**overrides) -> dict:
    base = dict(
        nome="João Silva",
        cpf="12345678901",
        email="joao@example.com",
        senha="senha123",
        role="user",
    )
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Validação de senha
# ---------------------------------------------------------------------------

def test_senha_minima_8_chars_aceita():
    dto = UserDTO(**_valid_data(senha="12345678"))
    assert dto.senha == "12345678"


def test_senha_menor_que_8_chars_levanta_erro():
    with pytest.raises(ValidationError, match="8 caracteres"):
        UserDTO(**_valid_data(senha="curta"))


def test_senha_exatamente_8_chars_aceita():
    dto = UserDTO(**_valid_data(senha="abcdefgh"))
    assert len(dto.senha) == 8


# ---------------------------------------------------------------------------
# Validação de CPF
# ---------------------------------------------------------------------------

def test_cpf_11_digitos_valido():
    dto = UserDTO(**_valid_data(cpf="98765432100"))
    assert dto.cpf == "98765432100"


def test_cpf_com_letras_levanta_erro():
    with pytest.raises(ValidationError, match="CPF inválido"):
        UserDTO(**_valid_data(cpf="1234567890A"))


def test_cpf_com_menos_de_11_digitos_levanta_erro():
    with pytest.raises(ValidationError, match="CPF inválido"):
        UserDTO(**_valid_data(cpf="1234567890"))


def test_cpf_com_mais_de_11_digitos_levanta_erro():
    with pytest.raises(ValidationError, match="CPF inválido"):
        UserDTO(**_valid_data(cpf="123456789012"))


# ---------------------------------------------------------------------------
# from_schema
# ---------------------------------------------------------------------------

def test_from_schema_cria_dto_corretamente():
    schema = UserCreate(
        nome="Maria",
        cpf="11122233344",
        email="maria@example.com",
        senha="senha_segura",
        role=RoleEnum.user,
    )
    dto = UserDTO.from_schema(schema)

    assert dto.nome == "Maria"
    assert dto.cpf == "11122233344"
    assert dto.email == "maria@example.com"
    assert dto.role == "user"


def test_from_schema_preserva_campos_opcionais():
    schema = UserCreate(
        nome="Carlos",
        cpf="11122233344",
        email="carlos@example.com",
        senha="senha_segura",
        telefone="11999999999",
        data_nascimento=date(1990, 5, 15),
        role=RoleEnum.admin,
    )
    dto = UserDTO.from_schema(schema)

    assert dto.telefone == "11999999999"
    assert dto.data_nascimento == date(1990, 5, 15)
    assert dto.role == "admin"
