from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String)
    description = Column(Text)

    budget = Column(Float, default=0.0)
    status = Column(String, default="active")

    owner_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Связи
    financial_events = relationship("FinancialEvent", back_populates="project")
    labor_entries = relationship("LaborEntry", back_populates="project")
    documents = relationship("Document", back_populates="project")
