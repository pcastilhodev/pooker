import pytest
from app.core.security import RoleChecker, User, get_current_user
from fastapi import HTTPException

# ---------------------------------------------------------------------------
# RoleChecker
# ---------------------------------------------------------------------------


def test_role_checker_permite_role_autorizada() -> None:
    checker = RoleChecker(allowed_roles=["ADMIN"])

    result = checker(x_user_role="ADMIN")

    assert result == "ADMIN"


def test_role_checker_sem_header_levanta_401() -> None:
    checker = RoleChecker(allowed_roles=["ADMIN"])

    with pytest.raises(HTTPException) as exc_info:
        checker(x_user_role=None)

    assert exc_info.value.status_code == 401


def test_role_checker_role_nao_autorizada_levanta_403() -> None:
    checker = RoleChecker(allowed_roles=["ADMIN"])

    with pytest.raises(HTTPException) as exc_info:
        checker(x_user_role="CLIENTE")

    assert exc_info.value.status_code == 403


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------


def test_get_current_user_retorna_user_valido() -> None:
    user = get_current_user(x_user_id=10, x_user_role="ADMIN")

    assert isinstance(user, User)
    assert user.id == 10
    assert user.role == "ADMIN"


def test_get_current_user_sem_id_levanta_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(x_user_id=None, x_user_role="ADMIN")  # type: ignore[arg-type]

    assert exc_info.value.status_code == 401


def test_get_current_user_sem_role_levanta_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(x_user_id=10, x_user_role=None)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 401
