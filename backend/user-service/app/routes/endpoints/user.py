from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
import requests

from app.schemas.schemas_user import UserCreate, UserOut, UserForAuth, UserLogin
from app.controllers import controller_user
from app.core.db_usuario import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return controller_user.create_user(db, user)
    except HTTPException as e:
        raise e


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return controller_user.list_users(db)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), response: Response = None):
    user = controller_user.obter_user(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    response.headers["X-User-Role"] = user.role.value
    return user


@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = controller_user.get_user_by_email(db, user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Email ou senha inválidos")

    if not pwd_context.verify(user.senha, db_user.senha):
        raise HTTPException(status_code=400, detail="Email ou senha inválidos")

    role_map = {"admin": "ADMIN", "user": "USER"}
    payload = {
        "userId": db_user.id,
        "password": user.senha,
        "role": role_map.get(db_user.role.value, "USER")
    }

    try:
        response = requests.post("http://localhost:8081/v1/api/authenticate", json=payload)
        if not response.ok:
            try:
                detail = response.json().get("detail", "Falha ao autenticar")
            except:
                detail = "Falha ao autenticar no Auth Service"
            raise HTTPException(status_code=400, detail=detail)

        auth_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao conectar com Auth Service: {str(e)}")

    return {
        "user": UserOut.from_orm(db_user),
        "token": auth_data.get("token")
    }


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    updated_user = controller_user.update_user(db, user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado para atualização")
    return updated_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    deleted_user = controller_user.delete_user(db, user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado para exclusão")
    return {"detail": "Usuário deletado com sucesso"}
