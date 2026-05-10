from app.models.models_user import User
from app.dtos.dto_user import UserDTO
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserFactory:
    @staticmethod
    def create(dto: UserDTO) -> User:
        return User(
            nome=dto.nome,
            cpf=dto.cpf,
            email=dto.email,
            senha=pwd_context.hash(dto.senha),
            telefone=dto.telefone,
            data_nascimento=dto.data_nascimento,
            role=dto.role
        )
