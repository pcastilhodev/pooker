# app/main.py
from contextlib import asynccontextmanager
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import filmes, reviews
from app.core.database import Base, engine
from app.models import filme, review  # noqa: F401 — registra models no Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Filmes Service", lifespan=lifespan)


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

origins = [
    "http://localhost:4200",  # seu front-end
    "http://127.0.0.1:4200",  # outra forma do localhost
    "*",  # para liberar todos os domínios (não recomendado em produção)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # qualquer domínio
    allow_credentials=True,  # permite cookies, auth headers, etc
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc
    allow_headers=["*"],  # todos os headers
)

app.include_router(filmes.router, prefix="/v1/filmes", tags=["filmes"])
app.include_router(reviews.router, prefix="/v1/reviews", tags=["reviews"])


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok, filmes-service"}
