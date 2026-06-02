from datetime import datetime

from pydantic import BaseModel, Field


class ReviewBaseSchema(BaseModel):
    review: str
    rating: int = Field(..., ge=0, le=10, description="A nota deve ser entre 0 e 10.")


class ReviewCreateSchema(ReviewBaseSchema):
    filme_id: int


class ReviewSchema(ReviewBaseSchema):
    id: int
    filme_id: int
    usuario_id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class ReviewUpdateSchema(ReviewBaseSchema):
    pass
