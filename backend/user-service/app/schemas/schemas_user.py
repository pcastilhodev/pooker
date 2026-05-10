from pydantic import BaseModel, EmailStr
from datetime import date
from app.models.models_user import RoleEnum


class UserCreate(BaseModel):
    nome: str
    cpf: str
    email: EmailStr
    senha: str
    telefone: str | None = None
    data_nascimento: date | None = None
    role: RoleEnum = RoleEnum.user


class UserOut(BaseModel):
    id: int
    nome: str
    cpf: str
    email: EmailStr
    telefone: str | None
    data_nascimento: date | None
    role: RoleEnum

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    senha: str


class UserForAuth(BaseModel):
    email: EmailStr
    role: str
    
    