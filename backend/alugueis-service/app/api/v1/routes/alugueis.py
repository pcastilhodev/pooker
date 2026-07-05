from typing import Any

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import User, get_current_user
from app.models.aluguel import Aluguel as AluguelModel
from app.schemas.aluguel import AluguelCreateSchema, AluguelSchema, AluguelSchemaPayment
from app.services.aluguel_service import AluguelService

router = APIRouter()
aluguel_service = AluguelService()


@router.post("/", response_model=AluguelSchemaPayment, status_code=201)
def create_aluguel(
    aluguel: AluguelCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        db_aluguel = aluguel_service.create(
            db=db, aluguel=aluguel, usuario_id=int(current_user.id)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao criar aluguel: {e}"
        ) from e

    try:
        payment_response = requests.post(
            "http://localhost:8005/api/v1/payment",
            timeout=10,
            json={
                "aluguel_id": db_aluguel.id,
                "user_id": int(current_user.id),
                "amount": db_aluguel.valor_aluguel,
            },
            headers={
                "X-User-Id": str(current_user.id),
                "X-User-Role": current_user.role,
            },
        )
        payment_response.raise_for_status()
        pagamento_data = payment_response.json()

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=503, detail=f"Erro ao comunicar com payment: {e}"
        ) from e

    return {"aluguel": db_aluguel, "pagamento": pagamento_data}


@router.post("/{aluguel_id}/devolucao", response_model=AluguelSchema)
def processar_devolucao(
    aluguel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AluguelModel | None:
    try:
        db_aluguel = aluguel_service.get_by_id(db=db, aluguel_id=aluguel_id)
        if db_aluguel is None:
            raise HTTPException(status_code=404, detail="Aluguel não encontrado.")

        is_admin = current_user.role in ("ADMIN", "admin")
        is_owner = db_aluguel.usuario_id == int(current_user.id)

        if not is_admin and not is_owner:
            raise HTTPException(status_code=403, detail="Permissão negada.")

        aluguel_devolvido = aluguel_service.processar_devolucao(
            db=db, aluguel_id=aluguel_id
        )
        return aluguel_devolvido
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ocorreu um erro inesperado: {e}"
        ) from e


@router.get("/", response_model=list[AluguelSchema])
def get_alugueis_por_usuario(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[dict[str, Any]]:
    return aluguel_service.get_by_usuario_enriched(
        db=db, usuario_id=int(current_user.id)
    )
