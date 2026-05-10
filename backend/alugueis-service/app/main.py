from fastapi import FastAPI
from app.api.v1.routes import alugueis
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Aluguéis Service")

origins = [
    "http://localhost:4200",  # seu front-end
    "http://127.0.0.1:4200"  # outra forma do localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # qualquer domínio
    allow_credentials=True,    # permite cookies, auth headers, etc
    allow_methods=["*"],       # GET, POST, PUT, DELETE, etc
    allow_headers=["*"],       # todos os headers
)

app.include_router(alugueis.router, prefix="/v1/alugueis", tags=["alugueis"])

@app.get("/")
def health_check():
    return {"status": "ok, alugueis-service"}