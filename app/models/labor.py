from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime


class LaborEntry(Base):
    __tablename__ = "labor_entries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    worker_id = Column(Integer, ForeignKey("users.id"))
    hours = Column(Float, nullable=False)  # Отработанные часы
    task = Column(String)  # Что именно делал (напр. "Шпаклевка")
    date = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="labor_entries")
