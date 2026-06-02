from fastapi import FastAPI

from app.core.db_usuario import Base, engine
from app.models import models_user  # noqa: F401 — registra model no Base
from app.routes import routes

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Rotas
app.include_router(routes.api_router, prefix="/api/v1")
