from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Основные данные
    name = Column(String, nullable=False)
    position = Column(String, nullable=True)  # Добавлено
    tax_id = Column(String, nullable=True)  # ДОБАВЬ ЭТО (ИНН/Регистрация)
    industry = Column(String, nullable=True)
    employees = Column(Integer, nullable=True)

    # Остальные поля без изменений...
    monthly_revenue = Column(Float, nullable=True)
    active_projects = Column(Integer, nullable=True)
    material_costs = Column(Float, nullable=True)
    personnel_costs = Column(Float, nullable=True)
    fixed_costs = Column(Float, nullable=True)
    software_accounting = Column(String, nullable=True)
    software_projects = Column(String, nullable=True)
    software_invoicing = Column(String, nullable=True)
    business_goal = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", back_populates="company")
