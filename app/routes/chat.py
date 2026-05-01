import os
import logging
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.routes.dashboard import get_current_user_from_header
from app.models.financial_event import FinancialEvent
from app.services.extraction import INCOME_CATEGORIES, EXPENSE_CATEGORIES

logger = logging.getLogger("chat")
router = APIRouter()


class ChatRequest(BaseModel):
    query: str


def _build_financial_context(user_id: int, db: Session) -> str:
    events = (
        db.query(FinancialEvent)
        .filter(FinancialEvent.user_id == user_id)
        .order_by(FinancialEvent.event_date.desc())
        .limit(200)
        .all()
    )

    income   = sum(e.amount or 0 for e in events if e.category in INCOME_CATEGORIES)
    expenses = sum(e.amount or 0 for e in events if e.category in EXPENSE_CATEGORIES)

    vendor_totals: dict = defaultdict(float)
    cat_totals:    dict = defaultdict(float)
    for e in events:
        if e.category in EXPENSE_CATEGORIES:
            if e.vendor:
                vendor_totals[e.vendor] += e.amount or 0
            cat_totals[e.category] += e.amount or 0

    top_vendors = sorted(vendor_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    top_cats    = sorted(cat_totals.items(),    key=lambda x: x[1], reverse=True)[:5]

    recurring       = [e for e in events if e.is_recurring]
    recurring_total = sum(e.amount or 0 for e in recurring)

    lines = [
        "Финансовый контекст пользователя:",
        f"  • Суммарный доход:   {income:,.2f} EUR",
        f"  • Суммарные расходы: {expenses:,.2f} EUR",
        f"  • Чистая прибыль:    {income - expenses:,.2f} EUR",
    ]
    if top_vendors:
        lines.append("  • Топ поставщиков по расходам: " +
                     ", ".join(f"{v} ({a:,.0f}€)" for v, a in top_vendors))
    if top_cats:
        lines.append("  • Топ категорий расходов: " +
                     ", ".join(f"{c} ({a:,.0f}€)" for c, a in top_cats))
    if recurring:
        lines.append(f"  • Повторяющиеся платежи: {len(recurring)} шт. на {recurring_total:,.2f} EUR/мес.")

    return "\n".join(lines)


SYSTEM_PROMPT = """Ты — финансовый ИИ-ассистент платформы TrueVision для малого и среднего бизнеса.

Правила:
• Отвечай только на русском языке, кратко и по делу (3-7 предложений).
• Если пользователь спрашивает о цифрах — используй данные из контекста ниже.
• Если данных нет — честно скажи, что нужно загрузить больше документов.
• Давай практичные советы, а не общие слова.
• Не выдумывай цифры, которых нет в контексте.

{context}"""


@router.post("/query")
def chat_query(
    body: ChatRequest,
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI сервис недоступен — добавьте ANTHROPIC_API_KEY в .env")

    context = _build_financial_context(user["id"], db)
    system  = SYSTEM_PROMPT.format(context=context)

    try:
        from anthropic import Anthropic
        client   = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system,
            messages=[{"role": "user", "content": body.query}],
        )
        answer = response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Anthropic error: {e}")
        raise HTTPException(status_code=502, detail=str(e))

    return {"answer": answer}
