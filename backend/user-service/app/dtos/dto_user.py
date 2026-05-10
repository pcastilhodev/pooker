from pydantic import BaseModel, validator
from app.schemas.schemas_user import UserCreate
from datetime import date

class UserDTO(BaseModel):
    nome: str
    cpf: str
    email: str
    senha: str
    telefone: str | None = None
    data_nascimento: date | None = None
    role: str = "user"

    @validator("senha")
    def validar_senha(cls, v):
        if len(v) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        return v

    @validator("cpf")
    def validate_cpf(cls, value):
        if not value.isdigit() or len(value) != 11:
            raise ValueError("CPF inválido. Deve conter 11 dígitos.")
        return value
    
    @classmethod
    def from_schema(cls, schema: UserCreate):
        return cls(**schema.dict())

