from app.dtos.dto_user import UserDTO
from app.factorie.factorie_user import UserFactory
from app.models.models_user import User
from app.schemas.schemas_user import UserCreate
from fastapi import HTTPException
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy.orm import Session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return str(pwd_context.hash(password))


def _build_dto(data: UserCreate) -> UserDTO:
    try:
        return UserDTO.from_schema(data)
    except ValidationError as e:
        # 422 (erro de validação do cliente), não 500 — sem isso, uma senha
        # curta ou CPF malformado derrubava a rota com um erro não tratado
        # (achado "Application Error Disclosure" do scan OWASP ZAP).
        detail = "; ".join(err["msg"] for err in e.errors())
        raise HTTPException(status_code=422, detail=detail) from e


def create_user(db: Session, data: UserCreate) -> User:
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    dto = _build_dto(data)
    new_user = UserFactory.create(dto)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def list_users(db: Session) -> list[User]:
    return db.query(User).all()


def obter_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, data: UserCreate) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    dto = _build_dto(data)

    user.nome = dto.nome  # type: ignore[assignment]
    user.cpf = dto.cpf  # type: ignore[assignment]
    user.email = dto.email  # type: ignore[assignment]
    user.senha = get_password_hash(dto.senha)  # type: ignore[assignment]
    user.telefone = dto.telefone  # type: ignore[assignment]
    user.data_nascimento = dto.data_nascimento  # type: ignore[assignment]
    user.role = dto.role  # type: ignore[assignment]

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    db.delete(user)
    db.commit()
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    return user
