import pytest
from app.core.security import get_current_user
from fastapi import HTTPException


class TestGetCurrentUser:
    def test_com_headers_validos_retorna_user(self):
        user = get_current_user(x_user_id="42", x_user_role="ADMIN")

        assert user.id == "42"
        assert user.role == "ADMIN"

    def test_com_x_user_id_nao_numerico_gera_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(x_user_id="abc", x_user_role="USER")

        assert exc_info.value.status_code == 401
