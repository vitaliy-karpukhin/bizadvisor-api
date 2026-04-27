from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user

router = APIRouter()


def require_role(role: str):
    """
    Возвращает зависимость для проверки роли пользователя.
    """

    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return current_user

    return role_checker


# Только авторизованные пользователи любого уровня
@router.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


# Только клиенты
@router.get("/client-only")
def client_endpoint(current_user: dict = Depends(require_role("client"))):
    return {"message": f"Hello client {current_user['email']}"}


# Только партнёры
@router.get("/partner-only")
def partner_endpoint(current_user: dict = Depends(require_role("partner"))):
    return {"message": f"Hello partner {current_user['email']}"}


# Только админы
@router.get("/admin-only")
def admin_endpoint(current_user: dict = Depends(require_role("admin"))):
    return {"message": f"Hello admin {current_user['email']}"}
