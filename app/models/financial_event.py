from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class FinancialEvent(Base):
    __tablename__ = "financial_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    event_type   = Column(String)
    vendor       = Column(String)
    amount       = Column(Float)
    currency     = Column(String)
    category     = Column(String)
    event_date   = Column(DateTime(timezone=True))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    is_recurring = Column(Boolean, default=False)  # повторяющийся платёж

    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="financial_events")  # ← вот это

    owner = relationship("User", back_populates="financial_events")
    document = relationship("Document", back_populates="events")
