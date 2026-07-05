from typing import Annotated

import requests
from app.controllers import controller_user
from app.core.db_usuario import get_db
from app.models.models_user import User
from app.schemas.schemas_user import UserCreate, UserLogin, UserOut
from fastapi import APIRouter, Depends, HTTPException, Response
from passlib.context import CryptContext
from sqlalchemy.orm import Session

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Annotated[Session, Depends(get_db)]) -> User:
    return controller_user.create_user(db, user)


@router.get("/", response_model=list[UserOut])
def list_users(db: Annotated[Session, Depends(get_db)]) -> list[User]:
    return controller_user.list_users(db)


@router.get(
    "/{user_id}",
    response_model=UserOut,
    responses={404: {"description": "Usuário não encontrado"}},
)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
) -> User:
    user = controller_user.obter_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    response.headers["X-User-Role"] = user.role.value
    return user


@router.post(
    "/login",
    responses={
        400: {
            "description": "Email ou senha inválidos, ou falha ao "
            "autenticar no Auth Service"
        },
        500: {"description": "Erro ao conectar com Auth Service"},
    },
)
def login_user(
    user: UserLogin, db: Annotated[Session, Depends(get_db)]
) -> dict[str, object]:
    db_user = controller_user.get_user_by_email(db, user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Email ou senha inválidos")

    if not pwd_context.verify(user.senha, db_user.senha):
        raise HTTPException(status_code=400, detail="Email ou senha inválidos")

    role_map = {"admin": "ADMIN", "user": "USER"}
    payload = {
        "userId": db_user.id,
        "password": user.senha,
        "role": role_map.get(db_user.role.value, "USER"),
    }

    try:
        response = requests.post(
            "http://localhost:8081/v1/api/authenticate", json=payload, timeout=10
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao conectar com Auth Service: {str(e)}"
        ) from e

    if not response.ok:
        try:
            detail = response.json().get("detail", "Falha ao autenticar")
        except Exception:
            detail = "Falha ao autenticar no Auth Service"
        raise HTTPException(status_code=400, detail=detail)

    auth_data = response.json()

    return {"user": UserOut.from_orm(db_user), "token": auth_data.get("token")}


@router.put(
    "/{user_id}",
    response_model=UserOut,
    responses={
        404: {"description": "Usuário não encontrado para atualização"},
    },
)
def update_user(
    user_id: int, user: UserCreate, db: Annotated[Session, Depends(get_db)]
) -> User:
    updated_user = controller_user.update_user(db, user_id, user)
    if not updated_user:
        raise HTTPException(
            status_code=404, detail="Usuário não encontrado para atualização"
        )
    return updated_user


@router.delete(
    "/{user_id}",
    responses={
        404: {"description": "Usuário não encontrado para exclusão"},
    },
)
def delete_user(
    user_id: int, db: Annotated[Session, Depends(get_db)]
) -> dict[str, str]:
    deleted_user = controller_user.delete_user(db, user_id)
    if not deleted_user:
        raise HTTPException(
            status_code=404, detail="Usuário não encontrado para exclusão"
        )
    return {"detail": "Usuário deletado com sucesso"}
