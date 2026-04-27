from pydantic import BaseModel
from typing import Optional


# Базовые поля, которые есть почти во всех компаниях
class CompanyBase(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    tax_id: Optional[str] = None


# Схема для создания (если нужно отдельно)
class CompanyCreate(CompanyBase):
    pass


# Схема, которую бэкенд отдает фронтенду
class CompanyResponse(CompanyBase):
    id: int

    # owner_id: int # если нужно понимать, чья это компания
    class Config:
        from_attributes = True
