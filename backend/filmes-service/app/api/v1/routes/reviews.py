from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import User, get_current_user
from app.models.review import Review
from app.schemas.review import ReviewCreateSchema, ReviewSchema, ReviewUpdateSchema
from app.services.filme_service import FilmeService
from app.services.review_service import ReviewService

router = APIRouter()
review_service = ReviewService()
filme_service = FilmeService()


@router.post(
    "/",
    status_code=201,
    responses={404: {"description": "Filme não encontrado."}},
)
def create_review(
    review: ReviewCreateSchema,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReviewSchema:
    filme_existente = filme_service.get(db=db, filme_id=review.filme_id)
    if not filme_existente:
        raise HTTPException(
            status_code=404, detail=f"Filme com o ID {review.filme_id} não encontrado."
        )

    return review_service.create(db=db, review=review, usuario_id=current_user.id)


@router.get("/filme/{filme_id}", response_model=list[ReviewSchema])
def get_reviews_by_filme(
    filme_id: int, db: Annotated[Session, Depends(get_db)]
) -> list[Review]:
    reviews = review_service.get_reviews_for_filme(db=db, filme_id=filme_id)
    return reviews


@router.put(
    "/{review_id}",
    response_model=ReviewSchema,
    responses={
        404: {"description": "Review não encontrado."},
        403: {"description": "Permissão negada. Você não pode alterar este review."},
    },
)
def update_review(
    review_id: int,
    review_update: ReviewUpdateSchema,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Review | None:
    db_review = review_service.get(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review não encontrado.")

    is_admin = current_user.role == "ADMIN"
    is_owner = db_review.usuario_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=403,
            detail="Permissão negada. Você não pode alterar este review.",
        )

    return review_service.update(
        db=db, review_id=review_id, review_update=review_update
    )


@router.delete(
    "/{review_id}",
    status_code=204,
    responses={
        404: {"description": "Review não encontrado."},
        403: {"description": "Permissão negada. Você não pode deletar este review."},
    },
)
def delete_review(
    review_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    db_review = review_service.get(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review não encontrado.")

    is_admin = current_user.role == "ADMIN"
    is_owner = db_review.usuario_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=403,
            detail="Permissão negada. Você não pode deletar este review.",
        )

    review_service.delete(db=db, review_id=review_id)
    return Response(status_code=204)
