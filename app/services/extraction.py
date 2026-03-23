from typing import Dict
from app.models.document import Document
from app.db.database import SessionLocal
import pdfplumber
from langdetect import detect
import re

def extract_text_from_pdf(file_path: str) -> str:
    """Извлекает текст из PDF файла"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting text: {e}")
    return text.strip()


def detect_language(text: str) -> str:
    """Определяет язык текста (de/en)"""
    try:
        if len(text) < 100:
            return "unknown"
        lang = detect(text)
        if lang.startswith("de"):
            return "de"
        if lang.startswith("en"):
            return "en"
        return "unknown"
    except:
        return "unknown"


def extract_financial_data(text: str, language: str = "de") -> Dict:
    """
    Извлекает финансовые данные из текста (правила или AI)
    Пока простая версия — потом замени на AI
    """
    data = {
        "amount": 0,
        "category": "other",
        "vendor": None,
        "currency": "EUR"
    }


    # Ищем суммы (например: 1.234,56 € или €1,234.56)
    amount_patterns = [
        r'(\d{1,3}(?:\.\d{3})*,\d{2})\s*€',  # DE: 1.234,56 €
        r'€\s*(\d{1,3}(?:,\d{3})*\.\d{2})',  # EN: €1,234.56
        r'Total[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})',
        r'Gesamt[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})',
        r'Rechnungsbetrag[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})',
    ]

    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                data["amount"] = float(amount_str)
                break
            except:
                pass

    # Определяем категорию по ключевым словам
    text_lower = text.lower()
    if any(word in text_lower for word in ["rechnung", "invoice", "payment received"]):
        data["category"] = "income"
    elif any(word in text_lower for word in ["material", "kosten", "expense", "purchase"]):
        data["category"] = "expense"

    # Ищем поставщика
    vendor_patterns = [
        r'Von[:\s]+([A-Za-z\s&]+)',
        r'Lieferant[:\s]+([A-Za-z\s&]+)',
        r'Vendor[:\s]+([A-Za-z\s&]+)',
    ]
    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["vendor"] = match.group(1).strip()[:50]
            break

    return data


def calculate_dashboard_metrics(current_user: dict) -> Dict:
    """
    Считаем бизнес-метрики на основе документов пользователя.
    """
    db = SessionLocal()
    try:
        user_id = current_user["id"]
        docs = db.query(Document).filter(Document.owner_id == user_id).all()

        income = 0
        expenses = 0

        for doc in docs:
            data = getattr(doc, "extraction_result", {}) or {}
            amount = data.get("amount", 0) or 0
            category = data.get("category", "other")

            if category in ["income", "sales"]:
                income += amount
            else:
                expenses += amount

        recurring_obligations = expenses * 0.25
        business_score = int((income - expenses) / max(income, 1) * 100)
        risk_level = "medium" if business_score < 50 else "low"
        growth_potential = "high" if business_score > 60 else "medium"

        return {
            "business_score": max(0, min(100, business_score)),  # 0-100
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "recurring_obligations": round(recurring_obligations, 2),
            "risk_level": risk_level,
            "growth_potential": growth_potential,
            "documents_analyzed": len(docs)
        }
    finally:
        db.close()


def process_document_extraction(document: Document, file_path: str) -> Dict:
    """
    Полный пайплайн обработки документа:
    1. Извлечь текст
    2. Определить язык
    3. Извлечь финансовые данные
    4. Вернуть результат для сохранения в БД
    """
    text = extract_text_from_pdf(file_path)
    language = detect_language(text)
    financial_data = extract_financial_data(text, language)

    return {
        "text": text[:1000],  # Храним первые 1000 символов
        "language": language,
        "amount": financial_data["amount"],
        "category": financial_data["category"],
        "vendor": financial_data["vendor"],
        "currency": financial_data["currency"]
    }