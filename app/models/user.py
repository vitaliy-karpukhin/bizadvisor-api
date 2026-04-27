from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    # Основные данные для входа
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)

    # Профиль пользователя
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)  # Ссылка на фото профиля
    path = Column(String, nullable=True)  # Путь (business/employee)

    # Статусы
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)

    # Таймстампы
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Связи (Relationships)
    company = relationship("Company", back_populates="owner", uselist=False)
    documents = relationship("Document", back_populates="owner")
    financial_events = relationship("FinancialEvent", back_populates="owner")

    def to_dict(self):
        """Метод для преобразования модели в словарь для API"""
        data = {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "path": self.path,
            "avatar_url": self.avatar_url,
            "is_verified": self.is_verified,
            "company": None
        }

        # Безопасное добавление данных компании
        if self.company:
            data["company"] = {
                "name": self.company.name or "",
                "position": self.company.position or "",
                "tax_id": self.company.tax_id or ""
            }

        return data