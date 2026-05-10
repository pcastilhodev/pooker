from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    filme_id = Column(Integer, ForeignKey("filmes.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    review = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("rating >= 0 AND rating <= 10", name="check_rating_range"),
    )

    filme = relationship("Filme", back_populates="reviews")