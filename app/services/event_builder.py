from sqlalchemy.orm import Session
from app.models.financial_event import FinancialEvent
import logging

logger = logging.getLogger(__name__)

def build_financial_event(document, db: Session, recommendations: list):
    """
    Создаёт записи в таблице financial_events
    на основе документа и рекомендаций
    """
    for rec in recommendations:
        event = FinancialEvent(
            document_id=document.id,
            user_id=document.owner_id,
            event_type=rec.get("problem", "Unknown"),
            vendor=None,
            amount=None,
            currency=None,
            category=None
        )
        db.add(event)
        logger.info(f"Financial event created: {event.event_type} for document {document.id}")

    db.commit()