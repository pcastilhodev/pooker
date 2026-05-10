from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models_user import User
from app.schemas.schemas_user import UserCreate
from passlib.context import CryptContext
from app.dtos.dto_user import UserDTO
from app.factorie.factorie_user import UserFactory


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_user(db: Session, data: UserCreate):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    dto = UserDTO.from_schema(data)
    new_user = UserFactory.create(dto)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def list_users(db: Session):
    return db.query(User).all()


def obter_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, data: UserCreate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    dto = UserDTO.from_schema(data)

    user.nome = dto.nome
    user.cpf = dto.cpf
    user.email = dto.email
    user.senha = get_password_hash(dto.senha)
    user.telefone = dto.telefone
    user.data_nascimento = dto.data_nascimento
    user.role = dto.role

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    db.delete(user)
    db.commit()
    return user

def get_user_by_email(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    return user
