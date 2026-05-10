from sqlalchemy.orm import Session
from app.models.review import Review as ReviewModel
from app.schemas.review import ReviewCreateSchema, ReviewUpdateSchema

class ReviewService:
    def get_reviews_for_filme(self, db: Session, filme_id: int):
        return db.query(ReviewModel).filter(ReviewModel.filme_id == filme_id).all()

    def get(self, db: Session, review_id: int):
        return db.query(ReviewModel).filter(ReviewModel.id == review_id).first()

    def create(self, db: Session, review: ReviewCreateSchema, usuario_id: int):
        db_review = ReviewModel(
            **review.dict(),
            usuario_id=usuario_id
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review

    def update(self, db: Session, review_id: int, review_update: ReviewUpdateSchema):
        db_review = self.get(db, review_id)
        if db_review is None:
            return None

        update_data = review_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_review, key, value)

        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review

    def delete(self, db: Session, review_id: int) -> bool:
        db_review = self.get(db, review_id)
        if db_review is None:
            return False
        db.delete(db_review)
        db.commit()
        return True