from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

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
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReviewUpdateSchema(ReviewBaseSchema):
    pass