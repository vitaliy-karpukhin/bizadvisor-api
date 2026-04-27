from pydantic import BaseModel, EmailStr
from typing import Optional
from .company import CompanyResponse, CompanyBase  # Импортируем схемы компании


# Базовые поля пользователя
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# Схема для обновления профиля (то, что летит с фронтенда)
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    # Добавляем возможность передать данные компании внутри юзера
    company: Optional[CompanyBase] = None


# Схема ответа сервера (то, что фронтенд получает и рисует)
class UserResponse(UserBase):
    id: int
    is_active: bool = True
    # Включаем компанию в ответ профиля
    company: Optional[CompanyResponse] = None

    class Config:
        from_attributes = True
