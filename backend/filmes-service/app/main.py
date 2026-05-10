# app/main.py
from fastapi import FastAPI
from app.api.v1.routes import filmes
from app.api.v1.routes import reviews
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Filmes Service")

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

app.include_router(filmes.router, prefix="/v1/filmes", tags=["filmes"])
app.include_router(reviews.router, prefix="/v1/reviews", tags=["reviews"])

@app.get("/")
def health_check():
    return {"status": "ok, filmes-service"}