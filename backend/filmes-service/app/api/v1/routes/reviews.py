from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.schemas.review import ReviewCreateSchema, ReviewSchema, ReviewUpdateSchema
from app.services.review_service import ReviewService
from app.services.filme_service import FilmeService
from app.core.database import get_db
from app.core.security import get_current_user, User

router = APIRouter()
review_service = ReviewService()
filme_service = FilmeService()

@router.post("/", response_model=ReviewSchema, status_code=201)
def create_review(
        review: ReviewCreateSchema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    filme_existente = filme_service.get(db=db, filme_id=review.filme_id)
    if not filme_existente:
        raise HTTPException(
            status_code=404,
            detail=f"Filme com o ID {review.filme_id} não encontrado."
        )

    return review_service.create(db=db, review=review, usuario_id=current_user.id)


@router.get("/filme/{filme_id}", response_model=List[ReviewSchema])
def get_reviews_by_filme(filme_id: int, db: Session = Depends(get_db)):
    reviews = review_service.get_reviews_for_filme(db=db, filme_id=filme_id)
    return reviews


@router.put("/{review_id}", response_model=ReviewSchema)
def update_review(
        review_id: int,
        review_update: ReviewUpdateSchema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_review = review_service.get(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review não encontrado.")

    is_admin = current_user.role == "ADMIN"
    is_owner = db_review.usuario_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Permissão negada. Você não pode alterar este review.")

    return review_service.update(db=db, review_id=review_id, review_update=review_update)


@router.delete("/{review_id}", status_code=204)
def delete_review(
        review_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    db_review = review_service.get(db, review_id=review_id)
    if db_review is None:
        raise HTTPException(status_code=404, detail="Review não encontrado.")

    is_admin = current_user.role == "ADMIN"
    is_owner = db_review.usuario_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Permissão negada. Você não pode deletar este review.")

    review_service.delete(db=db, review_id=review_id)
    return Response(status_code=204)