from datetime import datetime

from pydantic import BaseModel

from app.models.aluguel import AluguelStatus


class AluguelCreateSchema(BaseModel):
    filme_id: int


class AluguelSchema(BaseModel):
    id: int
    filme_id: int
    usuario_id: int
    data_aluguel: datetime
    data_prevista_devolucao: datetime
    data_devolucao: datetime | None = None
    valor_aluguel: float
    status: AluguelStatus
    filme_titulo: str | None = None
    filme_imagem_url: str | None = None

    class Config:
        from_attributes = True


class AluguelSchemaPayment(BaseModel):
    aluguel: AluguelSchema
    pagamento: dict

    class Config:
        from_attributes = True
