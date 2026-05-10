from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import date
from .review import ReviewSchema

class FilmeBaseSchema(BaseModel):
    titulo: str
    genero: str
    ano: int
    preco_aluguel: float
    sinopse: Optional[str] = None
    imagem_url: Optional[str] = None
    duracao_minutos: Optional[int] = None
    elenco: Optional[str] = None
    diretor: Optional[str] = None
    classificacao_indicativa: Optional[str] = None
    data_lancamento: Optional[date] = None

class FilmeCreateSchema(FilmeBaseSchema):
    total_copias: int

class FilmeUpdateSchema(FilmeBaseSchema):
    total_copias: int
    copias_disponiveis: int

class FilmeSchema(FilmeBaseSchema):
    id: int
    total_copias: int
    copias_disponiveis: int
    reviews: List[ReviewSchema] = []

    class Config:
        from_attributes = True

class InventarioUpdateSchema(BaseModel):
    acao: str
    quantidade: int = 1