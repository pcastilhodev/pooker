from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.routes import routes
from app.core.db_usuario import engine, Base
from app.models import models_user  # noqa: F401 — registra model no Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)

# Rotas
app.include_router(routes.api_router, prefix="/api/v1")
