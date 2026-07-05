from contextlib import asynccontextmanager
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response

from app.core.db_usuario import Base, engine
from app.models import models_user  # noqa: F401 — registra model no Base
from app.routes import routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)


def _with_security_headers(response: Response) -> Response:
    # Endereça achados do scan OWASP ZAP (X-Content-Type-Options e
    # Cross-Origin-Resource-Policy ausentes) sem depender de config externa.
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    return response


@app.middleware("http")
async def security_headers_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    return _with_security_headers(response)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> Response:
    # Evita vazar stack trace/mensagem interna em erros não tratados (achado
    # "Information Disclosure - Debug Error Messages" do scan OWASP ZAP).
    return _with_security_headers(
        Response(status_code=500, content="Erro interno do servidor.")
    )


# Rotas
app.include_router(routes.api_router, prefix="/api/v1")
