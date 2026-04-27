from datetime import datetime
from sqlalchemy.orm import Session
from app.models.financial_event import FinancialEvent
import logging

logger = logging.getLogger(__name__)

# Маппинг произвольных категорий → стандартные категории дашборда
_CATEGORY_MAP = {
    # Доходы
    "revenue":     "revenue",
    "income":      "revenue",
    "einnahmen":   "revenue",
    "verkauf":     "revenue",
    "umsatz":      "revenue",
    # Персонал
    "personnel":   "personnel",
    "personal":    "personnel",
    "gehalt":      "personnel",
    "lohn":        "personnel",
    "mitarbeiter": "personnel",
    # Аренда / Офис
    "rent":        "rent",
    "miete":       "rent",
    "büro":        "rent",
    "buero":       "rent",
    "office":      "rent",
    "bürokosten":  "rent",
    # Материалы
    "materials":   "materials",
    "material":    "materials",
    "werkzeug":    "materials",
    "equipment":   "materials",
    # ПО
    "software":    "software",
    "lizenz":      "software",
    "license":     "software",
    "abo":         "software",
    "subscription":"software",
    # Страховка
    "insurance":   "insurance",
    "versicherung":"insurance",
    # Налоги
    "tax":         "tax",
    "steuer":      "tax",
    "ertragsteuer":"tax",
    "mwst":        "tax",
    "vat":         "tax",
}


def _normalize_category(raw: str) -> str:
    """Приводит произвольную категорию к одной из стандартных."""
    if not raw:
        return "expense"
    raw_lower = raw.lower().strip()

    # Прямое совпадение
    if raw_lower in _CATEGORY_MAP:
        return _CATEGORY_MAP[raw_lower]

    # Частичное совпадение
    for key, val in _CATEGORY_MAP.items():
        if key in raw_lower:
            return val

    return "expense"


def build_financial_event(document, db: Session, events: list, recommendations: list = None):
    """
    Создаёт FinancialEvent для каждого извлечённого события документа.
    """
    # Удаляем старые события этого документа (не дублируем при повторном анализе)
    db.query(FinancialEvent).filter(FinancialEvent.document_id == document.id).delete()

    if not events:
        logger.warning(f"Document {document.id}: no events to save")
        db.commit()
        return

    # Запасной поставщик — из метаданных документа
    meta_vendor = (document.extraction_result or {}).get("firma")

    for ev in events:
        amount   = ev.get("amount") or 0
        currency = ev.get("currency") or "EUR"
        vendor   = ev.get("vendor") or meta_vendor
        raw_cat  = ev.get("category") or "other"

        if amount <= 0:
            continue

        category = _normalize_category(raw_cat)

        event = FinancialEvent(
            document_id=document.id,
            user_id=document.owner_id,
            event_type="invoice" if category == "revenue" else "expense",
            vendor=vendor,
            amount=float(amount),
            currency=currency,
            category=category,
            event_date=datetime.now(),
        )
        db.add(event)
        logger.info(
            f"FinancialEvent: doc={document.id} "
            f"category={category} amount={amount} {currency}"
        )

    db.commit()
