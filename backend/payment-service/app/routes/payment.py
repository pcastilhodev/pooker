from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import requests

router = APIRouter()

# Schema minimalista para a requisição de pagamento
class PaymentRequest(BaseModel):
    aluguel_id: int
    user_id: int
    amount: float

@router.post("/payment")
def process_payment(
    payment: PaymentRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    # Validação mínima
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Valor inválido para pagamento")

    # Resposta de sucesso
    response = {
        "status": 200,
        "aluguel_id": payment.aluguel_id,
        "user_id": payment.user_id,
        "amount": payment.amount,
        "message": "Payment processed successfully"
    }

    # Atualizar devolução do aluguel
    aluguel_api_url = f"http://localhost:8002/v1/alugueis/{payment.aluguel_id}/devolucao"

    try:
        aluguel_response = requests.post(
            aluguel_api_url,
            headers={
                "X-User-Id": x_user_id,
                "X-User-Role": x_user_role
            }
        )
        if aluguel_response.status_code != 200:
            response["warning"] = f"Não foi possível atualizar ativo do aluguel {payment.aluguel_id}"
        else:
            response["aluguel_update"] = aluguel_response.json()
    except Exception as e:
        response["warning"] = f"Erro ao comunicar com API de aluguel: {str(e)}"

    return response
