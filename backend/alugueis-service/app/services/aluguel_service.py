from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.aluguel import Aluguel as AluguelModel, AluguelStatus
from app.schemas.aluguel import AluguelCreateSchema
from app.core.config import settings
import httpx


class AluguelService:
    def get_by_usuario(self, db: Session, usuario_id: int):
        return db.query(AluguelModel).filter(AluguelModel.usuario_id == usuario_id).all()

    def get_by_id(self, db: Session, aluguel_id: int):
        return db.query(AluguelModel).filter(AluguelModel.id == aluguel_id).first()

    def create(self, db: Session, aluguel: AluguelCreateSchema, usuario_id: int):
        try:
            response = httpx.get(f"{settings.FILMES_SERVICE_URL}/v1/filmes/{aluguel.filme_id}")
            response.raise_for_status()
            filme_data = response.json()
            if filme_data.get("copias_disponiveis", 0) <= 0:
                raise ValueError("Filme sem cópias disponíveis.")

        except httpx.HTTPStatusError:
            raise ValueError(f"Filme com ID {aluguel.filme_id} não encontrado no serviço de filmes.")
        except httpx.RequestError:
            raise ConnectionError("Não foi possível comunicar com o serviço de filmes.")

        data_prevista_devolucao = datetime.now() + timedelta(days=3)

        db_aluguel = AluguelModel(
            filme_id=aluguel.filme_id,
            usuario_id=usuario_id,
            valor_aluguel=filme_data["preco_aluguel"],
            data_prevista_devolucao=data_prevista_devolucao,
            status=AluguelStatus.ATIVO
        )
        db.add(db_aluguel)

        try:
            payload = {"acao": "alugar"}
            response_patch = httpx.patch(f"{settings.FILMES_SERVICE_URL}/v1/filmes/{aluguel.filme_id}/inventario",
                                         json=payload)
            response_patch.raise_for_status()
        except httpx.RequestError:
            db.rollback()
            raise ConnectionError("Erro de comunicação ao tentar atualizar o inventário do filme.")
        except httpx.HTTPStatusError as e:
            db.rollback()
            raise ValueError(f"Não foi possível atualizar o inventário: {e.response.text}")

        db.commit()
        db.refresh(db_aluguel)
        return db_aluguel

    def processar_devolucao(self, db: Session, aluguel_id: int):
        db_aluguel = db.query(AluguelModel).filter(AluguelModel.id == aluguel_id).first()

        if not db_aluguel:
            return None

        if db_aluguel.status == AluguelStatus.DEVOLVIDO:
            raise ValueError("Este filme já foi devolvido.")

        try:
            payload = {"acao": "devolver"}
            response_patch = httpx.patch(f"{settings.FILMES_SERVICE_URL}/v1/filmes/{db_aluguel.filme_id}/inventario",
                                         json=payload)
            response_patch.raise_for_status()
        except httpx.RequestError:
            raise ConnectionError("Erro de comunicação ao tentar devolver o filme.")
        except httpx.HTTPStatusError as e:
            raise ValueError(f"Não foi possível atualizar o inventário na devolução: {e.response.text}")

        db_aluguel.status = AluguelStatus.DEVOLVIDO
        db_aluguel.data_devolucao = datetime.now()
        db.commit()
        db.refresh(db_aluguel)

        return db_aluguel