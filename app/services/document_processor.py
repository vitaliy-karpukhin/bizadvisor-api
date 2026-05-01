"""
Document processing pipeline:
1. Extract text from PDF
2. Parse financial data
3. Save results to database
4. Generate recommendations
"""

import logging
import os
import re
from sqlalchemy.orm import Session
from app.models.document import Document
from app.services.event_builder import build_financial_event
from app.services.ai import get_mock_recommendations

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


def process_document(document: Document, db: Session):
    """
    Полный пайплайн обработки документа.
    """

    logger.info(
        f"ENTER process_document for document_id={document.id}, filename={document.filename}"
    )

    try:
        logger.info(f"Start processing: {document.file_path}")

        # Шаг 1: Извлечение текста из файла
        extracted_text = _extract_text_from_file(document.file_path)
        logger.info(f"Extracted {len(extracted_text)} characters")

        # Шаг 2: Определение языка
        language = _detect_language(extracted_text)
        logger.info(f"Detected language: {language}")

        # Шаг 3: Извлечение финансовых данных (список событий)
        financial_events = _extract_financial_data(extracted_text, language)
        logger.info(f"Extracted {len(financial_events)} financial event(s)")

        # Шаг 4: Сохраняем результат в extraction_result для отображения
        meta  = _extract_meta(extracted_text)
        first = financial_events[0] if financial_events else {}
        document.extraction_result = {
            "language":     language,
            "events_count": len(financial_events),
            "amount":       first.get("amount", 0),
            "category":     first.get("category", "other"),
            "vendor":       first.get("vendor") or meta.get("firma"),
            "currency":     first.get("currency", "EUR"),
            **meta,
        }
        document.status = "processed"
        document.language = language

        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(f"Document {document.id} saved with extraction_result")

        # Шаг 5: Создание финансовых событий
        build_financial_event(document=document, db=db, events=financial_events)

        logger.info(f"Financial events created for document {document.id}")
        logger.info(f"EXIT process_document SUCCESS for document_id={document.id}")

    except Exception as e:
        db.rollback()
        logger.error(
            f"CRITICAL ERROR in process_document: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        document.status = "processing_failed"
        document.extraction_result = {"error": str(e)}
        db.add(document)
        db.commit()
        raise


def _extract_text_from_file(file_path: str) -> str:
    """
    Извлекает текст из файла (PDF или изображение).
    """
    if not file_path or not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return ""

    ext = file_path.rsplit(".", 1)[-1].lower()

    try:
        if ext == "pdf":
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            logger.info(f"PDF extracted: {len(text)} chars from {file_path}")
            return text.strip()

        if ext in ("jpg", "jpeg", "png"):
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(file_path)
                text = pytesseract.image_to_string(img, lang="deu+eng")
                logger.info(f"Image OCR extracted: {len(text)} chars")
                return text.strip()
            except ImportError:
                logger.warning("pytesseract/PIL not installed — OCR unavailable for images")
                return ""

        logger.warning(f"Unsupported file type: {ext}")
        return ""

    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        return ""


def _detect_language(text: str) -> str:
    """
    Определяет язык текста.
    """
    if not text:
        return "unknown"

    text_lower = text.lower()

    german_keywords = [
        "rechnung",
        "betrag",
        "mwst",
        "gesamt",
        "euro",
        "datum",
        "von",
        "an",
    ]
    english_keywords = [
        "invoice",
        "amount",
        "vat",
        "total",
        "eur",
        "date",
        "from",
        "to",
    ]

    de_count = sum(1 for kw in german_keywords if kw in text_lower)
    en_count = sum(1 for kw in english_keywords if kw in text_lower)

    if de_count > en_count:
        return "de"
    elif en_count > de_count:
        return "en"
    else:
        return "unknown"


def _parse_amount(s: str) -> float:
    """Парсит суммы в разных форматах: '1.963,50', '5000', '7.000 EUR'."""
    s = s.strip().replace("\xa0", "")
    if "," in s and "." in s:
        # Немецкий формат: 1.963,50
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        # Десятичная запятая: 5000,50
        s = s.replace(",", ".")
    else:
        # Точка как разделитель тысяч: 5.000 → 5000
        parts = s.split(".")
        if len(parts) == 2 and len(parts[1]) == 3:
            s = s.replace(".", "")
        # иначе точка как десятичный разделитель — оставляем
    try:
        return float(s)
    except ValueError:
        return 0.0


def _find_amount(text: str, patterns: list) -> float:
    """Ищет первую подходящую сумму по списку паттернов."""
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            amt = _parse_amount(m.group(1))
            if amt > 0:
                return amt
    return 0.0


def _find_vendor(text: str) -> str | None:
    VENDOR_RE = [
        # Банковские переводы
        r"Payment recipient\s+Name\s+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|IBAN|BIC|$)",
        r"Zahlungsempfänger\s+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|IBAN|BIC|$)",
        r"Empfänger\s+Name\s+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|IBAN|BIC|$)",
        # Счета / договоры
        r"Verkäufer[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
        r"Lieferant[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
        r"Vendor[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
        r"Von[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
        r"Auftragnehmer[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
        r"Anbieter[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|•|$)",
    ]
    for pattern in VENDOR_RE:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            v = m.group(1).strip().rstrip(".")
            if v and len(v) < 100:
                return v
    return None


def _extract_meta(text: str) -> dict:
    """Извлекает реквизиты документа: IBAN, фирма, номер счёта, дата, получатель."""
    meta = {}

    # Компания-отправитель — первая строка с GmbH/AG/KG и т.д.
    company_m = re.search(
        r"^([A-Za-zÄÖÜäöüß0-9\s\-&\.]+(?:GmbH|AG|KG|e\.K\.|GbR|OHG|UG|KGaA|Ltd|LLC|Inc))",
        text, re.IGNORECASE | re.MULTILINE
    )
    if company_m:
        meta["firma"] = company_m.group(1).strip()

    # IBAN
    iban_m = re.search(r"IBAN[:\s]+([A-Z]{2}\d{2}[\d\s]{13,30})", text, re.IGNORECASE)
    if iban_m:
        meta["iban"] = iban_m.group(1).strip().replace(" ", " ")

    # BIC / SWIFT
    bic_m = re.search(r"BIC[:\s]+([A-Z]{6}[A-Z0-9]{2,5})", text, re.IGNORECASE)
    if bic_m:
        meta["bic"] = bic_m.group(1).strip()

    # Номер счёта / Rechnung Nr
    inv_m = re.search(
        r"(?:Rechnung(?:s?nummer)?\.?\s*Nr\.?|Invoice\s*(?:No\.?|Nr\.?|#))[:\s]*([\w\-\/]+)",
        text, re.IGNORECASE
    )
    if inv_m:
        meta["rechnung_nr"] = inv_m.group(1).strip()

    # Дата счёта
    date_m = re.search(r"Datum[:\s]+([\d]{1,2}[./][\d]{1,2}[./][\d]{2,4})", text, re.IGNORECASE)
    if date_m:
        meta["datum"] = date_m.group(1).strip()

    # Срок оплаты
    due_m = re.search(
        r"(?:Zahlungsziel|Fällig(?:keit)?(?:\s*am)?|due(?:\s*date)?|pay(?:ment)?\s*by)[:\s]+([\d]{1,2}[./][\d]{1,2}[./][\d]{2,4})",
        text, re.IGNORECASE
    )
    if due_m:
        meta["faellig_am"] = due_m.group(1).strip()

    # Получатель
    emp_m = re.search(r"Empfänger[:\s]+([A-Za-zÄÖÜäöüß0-9\s&\.\-]+?)(?:\n|$)", text, re.IGNORECASE)
    if emp_m:
        meta["empfaenger"] = emp_m.group(1).strip()

    # Нетто-сумма
    netto_m = re.search(r"Nettobetrag[:\s]*([\d][0-9\.\,]+)\s*(?:€|EUR)?", text, re.IGNORECASE)
    if netto_m:
        meta["netto"] = _parse_amount(netto_m.group(1))

    # MwSt / НДС (информационно)
    mwst_m = re.search(r"(?:MwSt|VAT|USt)[^:\n]*?[:\s]+([\d][0-9\.\,]+)\s*(?:€|EUR)?", text, re.IGNORECASE)
    if mwst_m:
        meta["mwst"] = _parse_amount(mwst_m.group(1))

    return meta


def _detect_currency(text: str) -> str:
    if "USD" in text: return "USD"
    if "CHF" in text: return "CHF"
    if "RUB" in text or "руб" in text.lower(): return "RUB"
    return "EUR"


def _extract_financial_data(text: str, language: str = "de") -> list:
    """
    Возвращает список финансовых событий из документа.
    Финансовый отчёт может содержать и доходы, и расходы одновременно.
    """
    if not text:
        return []

    currency = _detect_currency(text)
    vendor   = _find_vendor(text)
    tl       = re.sub(r'[ \t\r\n]+', ' ', text.lower())
    events   = []

    CUR = r"(?:\s*(?:€|EUR))?"

    # ── Определяем тип документа ──────────────────────────────────────────
    # Банковский перевод (исходящий платёж) — всегда расход
    TRANSFER_SIGNALS = [
        "payment recipient", "zahlungsempfänger", "order type transfer",
        "überweisungsbestätigung", "auftragsbestätigung", "überweisen",
        "empfänger name", "zahlungsauftrag",
    ]
    is_transfer = any(s in tl for s in TRANSFER_SIGNALS)

    if is_transfer:
        # Для банковских переводов ищем только сумму перевода → расход
        TRANSFER_AMT = [
            rf"Amount[:\s]*([\d][0-9\.\,]+){CUR}",
            rf"Betrag[:\s]*([\d][0-9\.\,]+){CUR}",
            rf"([\d][0-9\.\,]+)\s*EUR",
            rf"([\d][0-9\.\,]+)\s*€",
        ]
        amt = _find_amount(text, TRANSFER_AMT)
        if amt > 0:
            events.append({"amount": amt, "category": "expense", "vendor": vendor, "currency": currency})
        return events

    # ── Итоговые доходы ────────────────────────────────────────────────────
    INCOME_PATTERNS = [
        rf"Gesamteinnahmen[^\d]*([\d][0-9\.\,]+){CUR}",
        rf"Gesamt\s+Einnahmen[^\d]*([\d][0-9\.\,]+){CUR}",
        rf"total income[^\d\n]*([\d][0-9\.\,]+){CUR}",
        rf"amounted to\s*([\d][0-9\.\,]+){CUR}",
        rf"Einnahmen[:\s]+([\d][0-9\.\,]+){CUR}",
        rf"income[:\s]+([\d][0-9\.\,]+){CUR}",
        rf"GESAMTBETRAG[:\s]*([\d][0-9\.\,]+){CUR}",
        rf"Rechnungsbetrag[:\s]*([\d][0-9\.\,]+){CUR}",
    ]

    # ── Итоговые расходы ───────────────────────────────────────────────────
    EXPENSE_PATTERNS = [
        rf"Gesamtausgaben[^\d]*([\d][0-9\.\,]+){CUR}",
        rf"Gesamt\s+Ausgaben[^\d]*([\d][0-9\.\,]+){CUR}",
        rf"gesamt(?:en?)?\s+Ausgaben[^\d\n]*([\d][0-9\.\,]+){CUR}",
        rf"total expenses[^\d\n]*([\d][0-9\.\,]+){CUR}",
        rf"Ausgaben[:\s]+([\d][0-9\.\,]+){CUR}",
        rf"Expenses[:\s]+([\d][0-9\.\,]+){CUR}",
    ]

    # ── Налоги ─────────────────────────────────────────────────────────────
    _TAXNUM = r"([\d]{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?)"
    TAX_PATTERNS = [
        rf"Ertragsteuer[^€\n]*?{_TAXNUM}{CUR}",
        rf"(?:income\s+)?tax[^€\n]*?{_TAXNUM}{CUR}",
        rf"Körperschaftsteuer[^€\n]*?{_TAXNUM}{CUR}",
        rf"Steuer[^€\n]*?{_TAXNUM}{CUR}",
        rf"MwSt[^€\n]*?{_TAXNUM}{CUR}",
        rf"VAT[^€\n]*?{_TAXNUM}{CUR}",
    ]

    income_amt  = _find_amount(text, INCOME_PATTERNS)
    expense_amt = _find_amount(text, EXPENSE_PATTERNS)
    tax_amt     = _find_amount(text, TAX_PATTERNS)

    if income_amt > 0 and expense_amt > 0:
        events.append({"amount": income_amt,  "category": "revenue", "vendor": vendor, "currency": currency})
        events.append({"amount": expense_amt, "category": "expense",  "vendor": vendor, "currency": currency})
    elif income_amt > 0:
        events.append({"amount": income_amt, "category": "revenue", "vendor": vendor, "currency": currency})
    elif expense_amt > 0:
        events.append({"amount": expense_amt, "category": "expense", "vendor": vendor, "currency": currency})

    if tax_amt > 0:
        events.append({"amount": tax_amt, "category": "tax", "vendor": vendor, "currency": currency})

    # Fallback — первое число, категория по ключевым словам
    if not events:
        fallback = _find_amount(text, [rf"([\d][0-9\.\,]+)\s*EUR", rf"([\d][0-9\.\,]+)\s*€"])
        if fallback > 0:
            income_kw  = ["einnahmen", "revenue", "income", "verkauf", "nettogewinn"]
            expense_kw = ["ausgaben", "expense", "kosten", "material", "purchase",
                          "rechnung von", "lieferant"]
            if any(k in tl for k in income_kw):
                cat = "revenue"
            elif any(k in tl for k in expense_kw):
                cat = "expense"
            else:
                cat = "other"
            events.append({"amount": fallback, "category": cat, "vendor": vendor, "currency": currency})

    return events
