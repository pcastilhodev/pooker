from datetime import datetime, timedelta
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.aluguel import Aluguel as AluguelModel
from app.models.aluguel import AluguelStatus
from app.schemas.aluguel import AluguelCreateSchema


class AluguelService:
    def get_by_usuario(self, db: Session, usuario_id: int) -> list[AluguelModel]:
        return (
            db.query(AluguelModel).filter(AluguelModel.usuario_id == usuario_id).all()
        )

    def get_by_usuario_enriched(
        self, db: Session, usuario_id: int
    ) -> list[dict[str, Any]]:
        alugueis = self.get_by_usuario(db, usuario_id)
        return [
            {
                "id": a.id,
                "filme_id": a.filme_id,
                "usuario_id": a.usuario_id,
                "data_aluguel": a.data_aluguel,
                "data_prevista_devolucao": a.data_prevista_devolucao,
                "data_devolucao": a.data_devolucao,
                "valor_aluguel": a.valor_aluguel,
                "status": a.status,
                "filme_titulo": None,
                "filme_imagem_url": None,
            }
            for a in alugueis
        ]

    def get_by_id(self, db: Session, aluguel_id: int) -> AluguelModel | None:
        return db.query(AluguelModel).filter(AluguelModel.id == aluguel_id).first()

    def create(
        self, db: Session, aluguel: AluguelCreateSchema, usuario_id: int
    ) -> AluguelModel:
        try:
            response = httpx.get(
                f"{settings.FILMES_SERVICE_URL}/v1/filmes/{aluguel.filme_id}"
            )
            response.raise_for_status()
            filme_data = response.json()
            if filme_data.get("copias_disponiveis", 0) <= 0:
                raise ValueError("Filme sem cópias disponíveis.")

        except httpx.HTTPStatusError as e:
            raise ValueError(
                f"Filme com ID {aluguel.filme_id} não encontrado no serviço de filmes."
            ) from e
        except httpx.RequestError as e:
            raise ConnectionError(
                "Não foi possível comunicar com o serviço de filmes."
            ) from e

        data_prevista_devolucao = datetime.now() + timedelta(days=3)

        db_aluguel = AluguelModel(
            filme_id=aluguel.filme_id,
            usuario_id=usuario_id,
            valor_aluguel=filme_data["preco_aluguel"],
            data_prevista_devolucao=data_prevista_devolucao,
            status=AluguelStatus.ATIVO,
        )
        db.add(db_aluguel)

        try:
            payload = {"acao": "alugar"}
            response_patch = httpx.patch(
                f"{settings.FILMES_SERVICE_URL}/v1/filmes/{aluguel.filme_id}/inventario",
                json=payload,
            )
            response_patch.raise_for_status()
        except httpx.RequestError as e:
            db.rollback()
            raise ConnectionError(
                "Erro de comunicação ao tentar atualizar o inventário do filme."
            ) from e
        except httpx.HTTPStatusError as e:
            db.rollback()
            raise ValueError(
                f"Não foi possível atualizar o inventário: {e.response.text}"
            ) from e

        db.commit()
        db.refresh(db_aluguel)
        return db_aluguel

    def processar_devolucao(self, db: Session, aluguel_id: int) -> AluguelModel | None:
        db_aluguel = (
            db.query(AluguelModel).filter(AluguelModel.id == aluguel_id).first()
        )

        if not db_aluguel:
            return None

        if db_aluguel.status == AluguelStatus.DEVOLVIDO:
            raise ValueError("Este filme já foi devolvido.")

        try:
            payload = {"acao": "devolver"}
            response_patch = httpx.patch(
                f"{settings.FILMES_SERVICE_URL}/v1/filmes/{db_aluguel.filme_id}/inventario",
                json=payload,
            )
            response_patch.raise_for_status()
        except httpx.RequestError as e:
            raise ConnectionError(
                "Erro de comunicação ao tentar devolver o filme."
            ) from e
        except httpx.HTTPStatusError as e:
            raise ValueError(
                "Não foi possível atualizar o inventário na devolução: "
                f"{e.response.text}"
            ) from e

        db_aluguel.status = AluguelStatus.DEVOLVIDO  # type: ignore[assignment]  # atribuição a Column do SQLAlchemy
        db_aluguel.data_devolucao = datetime.now()  # type: ignore[assignment]  # atribuição a Column do SQLAlchemy
        db.commit()
        db.refresh(db_aluguel)

        return db_aluguel
