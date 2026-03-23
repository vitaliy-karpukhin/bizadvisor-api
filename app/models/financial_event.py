from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class FinancialEvent(Base):
    __tablename__ = "financial_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))

    event_type = Column(String)
    vendor = Column(String)
    amount = Column(Float)
    currency = Column(String)
    category = Column(String)
    event_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="financial_events")
    document = relationship("Document", back_populates="events")