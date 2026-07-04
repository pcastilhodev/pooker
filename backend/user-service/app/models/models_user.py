from enum import StrEnum

from app.core.db_usuario import Base
from sqlalchemy import Column, Date, Integer, String
from sqlalchemy import Enum as PgEnum


class RoleEnum(StrEnum):
    admin = "admin"
    user = "user"


class User(Base):
    __tablename__ = "tb_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    cpf = Column(String(11), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    telefone = Column(String(20))
    data_nascimento = Column(Date)
    role = Column(
        PgEnum(RoleEnum, name="role_enum"), default=RoleEnum.user, nullable=False
    )
