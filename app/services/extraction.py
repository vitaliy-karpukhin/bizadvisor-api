from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict
import calendar as cal_lib

from sqlalchemy.orm import Session
import pdfplumber
from langdetect import detect
import re

from app.models.document import Document
from app.models.financial_event import FinancialEvent
from app.db.database import SessionLocal

INCOME_CATEGORIES  = {"revenue", "income"}
EXPENSE_CATEGORIES = {"materials", "personnel", "rent", "insurance", "software", "expense", "tax"}


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
    data = {"amount": 0, "category": "other", "vendor": None, "currency": "EUR"}

    # Ищем суммы (например: 1.234,56 € или €1,234.56)
    amount_patterns = [
        r"(\d{1,3}(?:\.\d{3})*,\d{2})\s*€",  # DE: 1.234,56 €
        r"€\s*(\d{1,3}(?:,\d{3})*\.\d{2})",  # EN: €1,234.56
        r"Total[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})",
        r"Gesamt[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})",
        r"Rechnungsbetrag[:\s]+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})",
    ]

    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace(".", "").replace(",", ".")
            try:
                data["amount"] = float(amount_str)
                break
            except:
                pass

    # Определяем категорию по ключевым словам
    text_lower = text.lower()
    if any(word in text_lower for word in ["rechnung", "invoice", "payment received"]):
        data["category"] = "income"
    elif any(
        word in text_lower for word in ["material", "kosten", "expense", "purchase"]
    ):
        data["category"] = "expense"

    # Ищем поставщика
    vendor_patterns = [
        r"Von[:\s]+([A-Za-z\s&]+)",
        r"Lieferant[:\s]+([A-Za-z\s&]+)",
        r"Vendor[:\s]+([A-Za-z\s&]+)",
    ]
    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["vendor"] = match.group(1).strip()[:50]
            break

    return data


def _period_since(period: str):
    now = datetime.now()
    if period == "week":
        return now - timedelta(days=7)
    if period == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if period == "year":
        return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return None


def _query_events(db: Session, user_id: int, period: str) -> List:
    since = _period_since(period)
    q = db.query(FinancialEvent).filter(FinancialEvent.user_id == user_id)
    if since:
        q = q.filter(FinancialEvent.event_date >= since)
    return q.all()


def calculate_dashboard_metrics(current_user: dict, db: Session, period: str = "month") -> Dict:
    user_id = current_user["id"]
    events = _query_events(db, user_id, period)

    income = sum(e.amount or 0 for e in events if e.category in INCOME_CATEGORIES)
    expenses = sum(e.amount or 0 for e in events if e.category in EXPENSE_CATEGORIES)

    recurring_obligations = expenses * 0.25
    business_score = int((income - expenses) / max(income, 1) * 100) if income > 0 else 0
    risk_level = "low" if business_score > 60 else ("medium" if business_score > 30 else "high")
    growth_potential = "high" if business_score > 60 else "medium"

    docs_count = db.query(Document).filter(Document.owner_id == user_id).count()

    return {
        "business_score": max(0, min(100, business_score)),
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "recurring_obligations": round(recurring_obligations, 2),
        "risk_level": risk_level,
        "growth_potential": growth_potential,
        "documents_analyzed": docs_count,
    }


def get_events_by_category(db: Session, user_id: int, event_type: str, period: str) -> Dict:
    events = _query_events(db, user_id, period)

    if event_type == "income":
        filtered = [e for e in events if e.category in INCOME_CATEGORIES]
    else:
        filtered = [e for e in events if e.category in EXPENSE_CATEGORIES]

    grouped: Dict[str, float] = defaultdict(float)
    for e in filtered:
        key = e.vendor or e.category or "other"
        grouped[key] += e.amount or 0

    total = sum(grouped.values())
    items = [
        {
            "category": cat,
            "amount": round(amount, 2),
            "percentage": round(amount / total * 100) if total > 0 else 0,
        }
        for cat, amount in sorted(grouped.items(), key=lambda x: x[1], reverse=True)
    ]

    return {"total": round(total, 2), "items": items[:10]}


def get_chart_data(db: Session, user_id: int, period: str) -> List:
    now = datetime.now()

    if period == "year":
        buckets = []
        for i in range(11, -1, -1):
            total_m = now.year * 12 + now.month - 1 - i
            yr, mo = total_m // 12, total_m % 12 + 1
            start = datetime(yr, mo, 1)
            _, last_day = cal_lib.monthrange(yr, mo)
            end = datetime(yr, mo, last_day, 23, 59, 59)
            buckets.append((cal_lib.month_abbr[mo], start, end))

    elif period == "week":
        buckets = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            buckets.append((day.strftime("Day %d"), start, end))

    else:  # month → 4 weekly buckets
        buckets = []
        for i in range(3, -1, -1):
            end = now - timedelta(weeks=i)
            start = end - timedelta(weeks=1)
            buckets.append((f"W{start.strftime('%V')}", start, end))

    result = []
    for label, start, end in buckets:
        evts = db.query(FinancialEvent).filter(
            FinancialEvent.user_id == user_id,
            FinancialEvent.event_date >= start,
            FinancialEvent.event_date <= end,
        ).all()
        income = sum(e.amount or 0 for e in evts if e.category in INCOME_CATEGORIES)
        expenses = sum(e.amount or 0 for e in evts if e.category in EXPENSE_CATEGORIES)
        result.append({"name": label, "income": round(income, 2), "expenses": round(expenses, 2)})

    return result


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
        "currency": financial_data["currency"],
    }
