from datetime import date

from app.schemas.schemas_user import UserCreate
from pydantic import BaseModel, validator


class UserDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    senha: str
    telefone: str | None = None
    data_nascimento: date | None = None
    role: str = "user"

    @validator("senha")
    def validar_senha(cls, v: str) -> str:  # noqa: N805
        if len(v) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        return v

    @validator("cpf")
    def validate_cpf(cls, value: str) -> str:  # noqa: N805
        if not value.isdigit() or len(value) != 11:
            raise ValueError("CPF inválido. Deve conter 11 dígitos.")
        return value

    @classmethod
    def from_schema(cls, schema: UserCreate) -> "UserDTO":
        return cls(**schema.dict())
