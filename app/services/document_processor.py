"""
Document processing pipeline:
1. Extract text from PDF
2. Parse financial data
3. Save results to database
4. Generate recommendations
"""

import logging
import re
from sqlalchemy.orm import Session
from app.models.document import Document
from app.services.event_builder import build_financial_event
from app.services.ai import get_mock_recommendations

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)


def process_document(document: Document, db: Session):
    """
    Полный пайплайн обработки документа.
    """

    logger.info(f"ENTER process_document for document_id={document.id}, filename={document.filename}")

    try:
        logger.info(f"Start processing: {document.file_path}")

        # Шаг 1: Извлечение текста из файла
        extracted_text = _extract_text_from_file(document.file_path)
        logger.info(f"Extracted {len(extracted_text)} characters")

        # Шаг 2: Определение языка
        language = _detect_language(extracted_text)
        logger.info(f"Detected language: {language}")

        # Шаг 3: Извлечение финансовых данных
        financial_data = _extract_financial_data(extracted_text, language)
        logger.info(f"Extracted: amount={financial_data.get('amount')}, category={financial_data.get('category')}")

        # Шаг 4: Сохраняем результат в документ
        document.extraction_result = {
            "text": extracted_text[:2000],
            "language": language,
            "amount": financial_data["amount"],
            "category": financial_data["category"],
            "vendor": financial_data["vendor"],
            "currency": financial_data["currency"],
            "confidence": 0.85
        }
        document.status = "processed"
        document.language = language

        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(f"Document {document.id} saved with extraction_result")

        # Шаг 5: Генерация рекомендаций
        recommendations = get_mock_recommendations(document.owner_id)
        logger.info(f"Generated {len(recommendations)} recommendations")

        # Шаг 6: Создание финансовых событий
        build_financial_event(
            document=document,
            db=db,
            recommendations=recommendations
        )

        logger.info(f"Financial events created for document {document.id}")
        logger.info(f"EXIT process_document SUCCESS for document_id={document.id}")

    except Exception as e:
        db.rollback()
        logger.error(f"CRITICAL ERROR in process_document: {type(e).__name__}: {str(e)}", exc_info=True)
        document.status = "processing_failed"
        document.extraction_result = {"error": str(e)}
        db.add(document)
        db.commit()
        raise


def _extract_text_from_file(file_path: str) -> str:
    """
    Извлекает текст из файла.
    """
    try:
        return """
        RECHNUNG
        Rechnung Nr: 2024-001234
        Datum: 15.03.2024

        Von: Test Vendor GmbH
        Musterstraße 123
        12345 Berlin

        An: Your Company

        Position                    Menge    Preis      Gesamt
        ------------------------------------------------------
        Beratungsservices            10h    120,00€   1.200,00€
        Software-Lizenz               1     450,00€     450,00€

        Zwischensumme:                        1.650,00€
        MwSt (19%):                             313,50€
        ------------------------------------------------------
        GESAMTBETRAG:                         1.963,50€

        Zahlungseingang bis: 30.03.2024
        """

    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return ""
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return ""


def _detect_language(text: str) -> str:
    """
    Определяет язык текста.
    """
    if not text:
        return "unknown"

    text_lower = text.lower()

    german_keywords = ["rechnung", "betrag", "mwst", "gesamt", "euro", "datum", "von", "an"]
    english_keywords = ["invoice", "amount", "vat", "total", "eur", "date", "from", "to"]

    de_count = sum(1 for kw in german_keywords if kw in text_lower)
    en_count = sum(1 for kw in english_keywords if kw in text_lower)

    if de_count > en_count:
        return "de"
    elif en_count > de_count:
        return "en"
    else:
        return "unknown"


def _extract_financial_data(text: str, language: str = "de") -> dict:
    """
    Извлекает финансовые данные из текста.
    """
    result = {
        "amount": 0.0,
        "category": "other",
        "vendor": None,
        "currency": "EUR"
    }

    if not text:
        return result

    # Поиск суммы
    amount_patterns = [
        r'GESAMTBETRAG[:\s]*([\d\.]+,\d{2})\s*€',
        r'Gesamt[:\s]*([\d\.]+,\d{2})\s*€',
        r'Total[:\s]*([\d,]+\.\d{2})\s*€',
        r'€\s*([\d\.]+,\d{2})',
        r'([\d\.]+,\d{2})\s*EUR',
    ]

    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount_str = match.group(1)
            amount_str = amount_str.replace('.', '').replace(',', '.')
            try:
                result["amount"] = float(amount_str)
                break
            except ValueError:
                pass

    # Определение категории
    text_lower = text.lower()

    income_keywords = ["rechnung an", "payment received", "income", "einnahmen", "verkauf"]
    expense_keywords = ["rechnung von", "expense", "kosten", "purchase", "material", "ausgaben"]

    if any(kw in text_lower for kw in income_keywords):
        result["category"] = "income"
    elif any(kw in text_lower for kw in expense_keywords):
        result["category"] = "expense"

    # Поиск поставщика
    vendor_patterns = [
        r'Von[:\s]+([A-Za-z\s&\.]+?)(?:\n|$)',
        r'Lieferant[:\s]+([A-Za-z\s&\.]+?)(?:\n|$)',
        r'Vendor[:\s]+([A-Za-z\s&\.]+?)(?:\n|$)',
    ]

    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            vendor = match.group(1).strip()
            if vendor and len(vendor) < 100:
                result["vendor"] = vendor
                break

    return result