from pydantic import BaseModel
from datetime import datetime
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

    class Config:
        from_attributes = True


class AluguelSchemaPayment(BaseModel):
    aluguel: AluguelSchema
    pagamento: dict

    class Config:
        from_attributes = True
