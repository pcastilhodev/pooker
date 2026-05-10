from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.schemas.filme import FilmeCreateSchema, FilmeSchema, FilmeUpdateSchema, InventarioUpdateSchema
from app.services.filme_service import FilmeService
from app.core.database import get_db
from app.core.security import RoleChecker

allow_admin_only = RoleChecker(allowed_roles=["ADMIN"])
router = APIRouter()
filme_service = FilmeService()

@router.get("/", response_model=List[FilmeSchema])
def get_all_filmes(db: Session = Depends(get_db)):
    return filme_service.get_all(db)

@router.post("/", response_model=FilmeSchema, status_code=201, dependencies=[Depends(allow_admin_only)])
def create_filme(filme: FilmeCreateSchema, db: Session = Depends(get_db)):
    print("DEBUG: Recebido payload:", filme.dict())
    try:
        resultado = filme_service.create(db=db, filme=filme)
        print("DEBUG: Resultado do serviço:", resultado)
        return resultado
    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{filme_id}", response_model=FilmeSchema)
def get_filme(filme_id: int, db: Session = Depends(get_db)):
    db_filme = filme_service.get(db=db, filme_id=filme_id)
    if db_filme is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return db_filme

@router.put("/{filme_id}", response_model=FilmeSchema, dependencies=[Depends(allow_admin_only)])
def update_filme(filme_id: int, filme_update: FilmeUpdateSchema, db: Session = Depends(get_db)):
    db_filme = filme_service.update(db=db, filme_id=filme_id, filme_update=filme_update)
    if db_filme is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return db_filme

@router.delete("/{filme_id}", status_code=204, dependencies=[Depends(allow_admin_only)])
def delete_filme(filme_id: int, db: Session = Depends(get_db)):
    success = filme_service.delete(db=db, filme_id=filme_id)
    if not success:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return Response(status_code=204)

@router.get("/search/", response_model=List[FilmeSchema])
def search_filmes(titulo: str = None, genero: str = None, db: Session = Depends(get_db)):
    filmes = filme_service.search(db=db, titulo=titulo, genero=genero)
    if not filmes:
        raise HTTPException(status_code=404, detail="Nenhum filme encontrado com os critérios fornecidos")
    return filmes

@router.patch("/{filme_id}/inventario", response_model=FilmeSchema)
def update_inventario(filme_id: int, inventario_update: InventarioUpdateSchema, db: Session = Depends(get_db)):
    db_filme = filme_service.update_inventario(db=db, filme_id=filme_id, acao=inventario_update.acao)
    if db_filme is None:
        raise HTTPException(status_code=404, detail="Filme não encontrado")
    return db_filme