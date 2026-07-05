# filmes-service/app/services/filme_service.py
from app.models.filme import Filme as FilmeModel
from app.schemas.filme import FilmeCreateSchema, FilmeUpdateSchema
from sqlalchemy.orm import Session


class FilmeService:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> list[FilmeModel]:
        return db.query(FilmeModel).offset(skip).limit(limit).all()

    def get(self, db: Session, filme_id: int) -> FilmeModel | None:
        return db.query(FilmeModel).filter(FilmeModel.id == filme_id).first()

    def create(self, db: Session, filme: FilmeCreateSchema) -> FilmeModel:
        db_filme = FilmeModel(**filme.dict(), copias_disponiveis=filme.total_copias)
        db.add(db_filme)
        db.commit()
        db.refresh(db_filme)
        return db_filme

    def update(
        self, db: Session, filme_id: int, filme_update: FilmeUpdateSchema
    ) -> FilmeModel | None:
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

    def search(
        self, db: Session, titulo: str | None = None, genero: str | None = None
    ) -> list[FilmeModel]:
        query = db.query(FilmeModel)
        if titulo:
            query = query.filter(FilmeModel.titulo.ilike(f"%{titulo}%"))
        if genero:
            query = query.filter(FilmeModel.genero.ilike(f"%{genero}%"))

        return query.all()

    def update_inventario(
        self, db: Session, filme_id: int, acao: str
    ) -> FilmeModel | None:
        db_filme = self.get(db, filme_id)
        if db_filme is None:
            return None
        if acao == "alugar":
            if db_filme.copias_disponiveis > 0:
                db_filme.copias_disponiveis -= 1  # type: ignore[assignment]
            else:
                raise ValueError("Não há cópias disponíveis para alugar.")

        elif acao == "devolver":
            if db_filme.copias_disponiveis < db_filme.total_copias:
                db_filme.copias_disponiveis += 1  # type: ignore[assignment]
            else:
                raise ValueError(
                    "Inventário já está completo, não é possível devolver."
                )
        else:
            raise ValueError("Ação inválida. Use 'alugar' ou 'devolver'.")

        db.commit()
        db.refresh(db_filme)
        return db_filme
