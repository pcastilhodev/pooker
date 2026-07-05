from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class User(BaseModel):
    id: str
    role: str


def get_current_user(
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
) -> User:
    if x_user_id is None or x_user_role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabeçalhos X-User-Id e X-User-Role são obrigatórios.",
        )
    if not x_user_id.isdigit():
        # Evita que um X-User-Id malformado derrube a rota com um ValueError
        # não tratado ao converter para int mais adiante (500 genérico
        # detectado pelo scan OWASP ZAP como "Application Error Disclosure").
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabeçalho X-User-Id inválido.",
        )
    return User(id=x_user_id, role=x_user_role)
