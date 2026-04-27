from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=True)
    status = Column(String, default="uploaded")
    payment_status = Column(String, default="pending")  # pending / paid / overdue
    file_hash = Column(String, nullable=True)            # SHA-256 содержимого файла
    language = Column(String, default="unknown")
    extraction_result = Column(JSON, default={})
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # ← добавили
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", back_populates="documents")
    events = relationship("FinancialEvent", back_populates="document")
    project = relationship("Project", back_populates="documents")  # ← добавили
