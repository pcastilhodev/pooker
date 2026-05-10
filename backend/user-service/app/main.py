from fastapi import FastAPI
from app.routes import routes

app = FastAPI()

# Rotas
app.include_router(routes.api_router, prefix="/api/v1")
