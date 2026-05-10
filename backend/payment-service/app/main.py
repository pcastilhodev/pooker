from fastapi import FastAPI
from app.routes.payment import router as payment_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

origins = [
    "http://localhost:4200",  # seu front-end
    "http://127.0.0.1:4200",  # outra forma do localhost
    "*"  # para liberar todos os domínios (não recomendado em produção)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # qualquer domínio
    allow_credentials=True,    # permite cookies, auth headers, etc
    allow_methods=["*"],       # GET, POST, PUT, DELETE, etc
    allow_headers=["*"],       # todos os headers
)

# Rotas
app.include_router(payment_router, prefix="/api/v1")
