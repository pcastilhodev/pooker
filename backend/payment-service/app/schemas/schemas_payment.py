from pydantic import BaseModel


class PaymentRequest(BaseModel):
    aluguel_id: int
    user_id: int
    amount: float
    card_number: str
    card_holder: str
    expiration_date: str
    cvv: str
