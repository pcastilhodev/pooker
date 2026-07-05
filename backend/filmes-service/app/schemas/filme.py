from datetime import date

from pydantic import BaseModel

from .review import ReviewSchema


class FilmeBaseSchema(BaseModel):
    titulo: str
    genero: str
    ano: int
    preco_aluguel: float
    sinopse: str | None = None
    imagem_url: str | None = None
    duracao_minutos: int | None = None
    elenco: str | None = None
    diretor: str | None = None
    diretor_foto_url: str | None = None
    classificacao_indicativa: str | None = None
    data_lancamento: date | None = None


class FilmeCreateSchema(FilmeBaseSchema):
    total_copias: int


class FilmeUpdateSchema(FilmeBaseSchema):
    total_copias: int
    copias_disponiveis: int


class FilmeSchema(FilmeBaseSchema):
    id: int
    total_copias: int
    copias_disponiveis: int
    reviews: list[ReviewSchema] = []

    class Config:
        from_attributes = True


class InventarioUpdateSchema(BaseModel):
    acao: str
    quantidade: int = 1
