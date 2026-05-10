# filmes-service/app/services/filme_service.py
from sqlalchemy.orm import Session
from app.models.filme import Filme as FilmeModel
from app.schemas.filme import FilmeCreateSchema, FilmeUpdateSchema


class FilmeService:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(FilmeModel).offset(skip).limit(limit).all()

    def get(self, db: Session, filme_id: int):
        return db.query(FilmeModel).filter(FilmeModel.id == filme_id).first()

    def create(self, db: Session, filme: FilmeCreateSchema):
        db_filme = FilmeModel(
            **filme.dict(),
            copias_disponiveis=filme.total_copias
        )
        db.add(db_filme)
        db.commit()
        db.refresh(db_filme)
        return db_filme

    def update(self, db: Session, filme_id: int, filme_update: FilmeUpdateSchema):
        db_filme = self.get(db, filme_id)
        if db_filme is None:
            return None

        update_data = filme_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_filme, key, value)

        db.add(db_filme)
        db.commit()
        db.refresh(db_filme)
        return db_filme

    def delete(self, db: Session, filme_id: int) -> bool:
        db_filme = self.get(db, filme_id)
        if db_filme is None:
            return False

        db.delete(db_filme)
        db.commit()
        return True

    def search(self, db: Session, titulo: str = None, genero: str = None):
        query = db.query(FilmeModel)
        if titulo:
            query = query.filter(FilmeModel.titulo.ilike(f"%{titulo}%"))
        if genero:
            query = query.filter(FilmeModel.genero.ilike(f"%{genero}%"))

        return query.all()

    def update_inventario(self, db: Session, filme_id: int, acao: str):
        db_filme = self.get(db, filme_id)
        if db_filme is None:
            return None
        if acao == "alugar":
            if db_filme.copias_disponiveis > 0:
                db_filme.copias_disponiveis -= 1
            else:
                raise ValueError("Não há cópias disponíveis para alugar.")

        elif acao == "devolver":
            if db_filme.copias_disponiveis < db_filme.total_copias:
                db_filme.copias_disponiveis += 1
            else:
                raise ValueError("Inventário já está completo, não é possível devolver.")
        else:
            raise ValueError("Ação inválida. Use 'alugar' ou 'devolver'.")

        db.commit()
        db.refresh(db_filme)
        return db_filme