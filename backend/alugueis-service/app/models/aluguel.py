from sqlalchemy import Column, Integer, String, DateTime, Float, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class AluguelStatus(str, enum.Enum):
    ATIVO = "ativo"
    DEVOLVIDO = "devolvido"
    ATRASADO = "atrasado"

class Aluguel(Base):
    __tablename__ = "alugueis"

    id = Column(Integer, primary_key=True, index=True)
    filme_id = Column(Integer, nullable=False)
    usuario_id = Column(Integer, nullable=False)

    data_aluguel = Column(DateTime(timezone=True), server_default=func.now())
    data_prevista_devolucao = Column(DateTime(timezone=True), nullable=False)
    data_devolucao = Column(DateTime(timezone=True), nullable=True)

    valor_aluguel = Column(Float, nullable=False)
    status = Column(Enum(AluguelStatus), default=AluguelStatus.ATIVO)