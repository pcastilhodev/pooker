from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker
from app.models.filme import Filme
from app.schemas.filme import (
    FilmeCreateSchema,
    FilmeSchema,
    FilmeUpdateSchema,
    InventarioUpdateSchema,
)
from app.services.filme_service import FilmeService

FILME_NAO_ENCONTRADO = "Filme não encontrado"

allow_admin_only = RoleChecker(allowed_roles=["ADMIN"])
router = APIRouter()
filme_service = FilmeService()


@router.get("/", response_model=list[FilmeSchema])
def get_all_filmes(db: Annotated[Session, Depends(get_db)]) -> list[Filme]:
    return filme_service.get_all(db)


@router.post(
    "/",
    status_code=201,
    dependencies=[Depends(allow_admin_only)],
    responses={500: {"description": "Erro interno ao criar o filme."}},
)
def create_filme(
    filme: FilmeCreateSchema, db: Annotated[Session, Depends(get_db)]
) -> FilmeSchema:
    print("DEBUG: Recebido payload:", filme.dict())
    try:
        resultado = filme_service.create(db=db, filme=filme)
        print("DEBUG: Resultado do serviço:", resultado)
        return resultado
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/{filme_id}",
    responses={404: {"description": FILME_NAO_ENCONTRADO}},
)
def get_filme(filme_id: int, db: Annotated[Session, Depends(get_db)]) -> FilmeSchema:
    db_filme = filme_service.get(db=db, filme_id=filme_id)
    if db_filme is None:
        raise HTTPException(status_code=404, detail=FILME_NAO_ENCONTRADO)
    return db_filme


@router.put(
    "/{filme_id}",
    dependencies=[Depends(allow_admin_only)],
    responses={404: {"description": FILME_NAO_ENCONTRADO}},
)
def update_filme(
    filme_id: int,
    filme_update: FilmeUpdateSchema,
    db: Annotated[Session, Depends(get_db)],
) -> FilmeSchema:
    db_filme = filme_service.update(db=db, filme_id=filme_id, filme_update=filme_update)
    if db_filme is None:
        raise HTTPException(status_code=404, detail=FILME_NAO_ENCONTRADO)
    return db_filme


@router.delete(
    "/{filme_id}",
    status_code=204,
    dependencies=[Depends(allow_admin_only)],
    responses={404: {"description": FILME_NAO_ENCONTRADO}},
)
def delete_filme(filme_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    success = filme_service.delete(db=db, filme_id=filme_id)
    if not success:
        raise HTTPException(status_code=404, detail=FILME_NAO_ENCONTRADO)
    return Response(status_code=204)


@router.get(
    "/search/",
    response_model=list[FilmeSchema],
    responses={
        404: {"description": "Nenhum filme encontrado com os critérios fornecidos"}
    },
)
def search_filmes(
    db: Annotated[Session, Depends(get_db)],
    titulo: str | None = None,
    genero: str | None = None,
) -> list[Filme]:
    filmes = filme_service.search(db=db, titulo=titulo, genero=genero)
    if not filmes:
        raise HTTPException(
            status_code=404,
            detail="Nenhum filme encontrado com os critérios fornecidos",
        )
    return filmes


@router.patch(
    "/{filme_id}/inventario",
    responses={404: {"description": FILME_NAO_ENCONTRADO}},
)
def update_inventario(
    filme_id: int,
    inventario_update: InventarioUpdateSchema,
    db: Annotated[Session, Depends(get_db)],
) -> FilmeSchema:
    db_filme = filme_service.update_inventario(
        db=db, filme_id=filme_id, acao=inventario_update.acao
    )
    if db_filme is None:
        raise HTTPException(status_code=404, detail=FILME_NAO_ENCONTRADO)
    return db_filme
