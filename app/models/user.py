from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    # Основные поля
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Хранить хэш пароля
    role = Column(String, default="user", nullable=False)  # client / partner / admin

    # Личные данные
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True, unique=False)

    # Статус аккаунта
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Время
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Метод для удобной сериализации (например, для API)
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    documents = relationship("Document", back_populates="owner")
    financial_events = relationship("FinancialEvent", back_populates="owner")
