from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import csv, io, os

from app.config import SECRET_KEY, ALGORITHM
from app.services.extraction import (
    calculate_dashboard_metrics,
    get_events_by_category,
    get_chart_data,
)
from app.services.ai import get_mock_recommendations
from app.db.database import get_db
from app.models.user import User

router = APIRouter()


# --- Схемы данных (Pydantic) ---


class DashboardResponse(BaseModel):
    business_score: int
    income: float
    expenses: float
    recurring_obligations: float
    risk_level: str
    growth_potential: str
    documents_analyzed: int = 0

    class Config:
        from_attributes = True


class Recommendation(BaseModel):
    problem: str
    effect: str
    recommendation: str
    action_url: str

    class Config:
        from_attributes = True


# --- Зависимость для авторизации ---


def get_current_user_from_header(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),  # Используем общую функцию get_db
) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload invalid",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


# --- Эндпоинты ---


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    period: str = Query("month", pattern="^(week|month|year|all)$"),
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    return calculate_dashboard_metrics(current_user=user, db=db, period=period)


@router.get("/chart-data")
def get_dashboard_chart(
    period: str = Query("week", pattern="^(week|month|year)$"),
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    return get_chart_data(db=db, user_id=user["id"], period=period)


@router.get("/events/categories")
def get_dashboard_categories(
    type: str = Query("income", pattern="^(income|expense)$"),
    period: str = Query("month", pattern="^(week|month|year|all)$"),
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    return get_events_by_category(db=db, user_id=user["id"], event_type=type, period=period)


@router.get("/export")
def export_transactions(
    period: str = Query("month", pattern="^(week|month|year|all)$"),
    type: str = Query("all", pattern="^(all|income|expense)$"),
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    from app.services.extraction import _query_events, INCOME_CATEGORIES, EXPENSE_CATEGORIES

    events = _query_events(db, user["id"], period)

    if type == "income":
        events = [e for e in events if e.category in INCOME_CATEGORIES]
    elif type == "expense":
        events = [e for e in events if e.category in EXPENSE_CATEGORIES]

    events = sorted(events, key=lambda e: e.event_date or "", reverse=True)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Дата", "Тип документа", "Категория", "Поставщик", "Сумма", "Валюта"])

    for e in events:
        writer.writerow([
            e.event_date.strftime("%d.%m.%Y") if e.event_date else "",
            e.event_type or "",
            e.category or "",
            e.vendor or "",
            str(e.amount or 0).replace(".", ","),
            e.currency or "EUR",
        ])

    output.seek(0)
    filename = f"transactions_{type}_{period}.csv"

    return StreamingResponse(
        iter(["﻿" + output.getvalue()]),  # BOM для корректного открытия в Excel
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/transactions")
def get_transactions(
    period: str = Query("month", pattern="^(week|month|year|all)$"),
    type:   str = Query("all",   pattern="^(all|income|expense|tax)$"),
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    from app.services.extraction import _query_events, INCOME_CATEGORIES, EXPENSE_CATEGORIES
    from datetime import datetime

    events = _query_events(db, user["id"], period)

    # Дедупликация: если одна и та же сумма+получатель присутствует как доход
    # из одного документа И как расход из другого документа — это дубль загрузки.
    # Оставляем только расход (банковский перевод = расход по определению).
    expense_keys = set()
    for e in events:
        if e.category not in ("revenue", "income") and e.vendor:
            expense_keys.add((round(e.amount or 0, 2), e.vendor))
    if expense_keys:
        events = [
            e for e in events
            if not (
                e.category in ("revenue", "income")
                and e.vendor
                and (round(e.amount or 0, 2), e.vendor) in expense_keys
            )
        ]

    if type == "income":
        events = [e for e in events if e.category in INCOME_CATEGORIES]
    elif type == "expense":
        events = [e for e in events if e.category in EXPENSE_CATEGORIES and e.category != "tax"]
    elif type == "tax":
        events = [e for e in events if e.category == "tax"]

    events = sorted(events, key=lambda e: e.event_date or datetime.min, reverse=True)

    return {
        "total": len(events),
        "items": [
            {
                "id":           e.id,
                "date":         e.event_date.strftime("%d.%m.%Y") if e.event_date else "—",
                "vendor":       e.vendor or "—",
                "category":     e.category or "other",
                "amount":       e.amount or 0,
                "currency":     e.currency or "EUR",
                "event_type":   e.event_type or "—",
                "document_id":  e.document_id,
                "is_recurring": bool(e.is_recurring),
            }
            for e in events
        ],
    }


class CreateTransactionRequest(BaseModel):
    vendor: str
    amount: float
    category: str
    event_date: str  # "YYYY-MM-DD"
    is_recurring: bool = False


def _check_expense_alert(user_id: int, db) -> None:
    """Создаёт уведомление если расходы текущего месяца превысили доходы."""
    from app.models.financial_event import FinancialEvent
    from app.models.notification import Notification
    from app.services.extraction import INCOME_CATEGORIES
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    events = db.query(FinancialEvent).filter(
        FinancialEvent.user_id == user_id,
        FinancialEvent.event_date >= month_start,
    ).all()

    income   = sum(e.amount or 0 for e in events if e.category in INCOME_CATEGORIES)
    expenses = sum(e.amount or 0 for e in events if e.category not in INCOME_CATEGORIES)

    if expenses <= income:
        return

    # Не дублируем — проверяем нет ли уже непрочитанного алерта за этот месяц
    already = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.title == "Расходы превысили доходы",
        Notification.is_read == False,  # noqa: E712
        Notification.created_at >= month_start,
    ).first()

    if already:
        return

    diff = expenses - income
    db.add(Notification(
        user_id=user_id,
        title="Расходы превысили доходы",
        body=f"В этом месяце расходы больше доходов на {diff:,.0f} €".replace(",", "."),
        type="warning",
    ))


@router.post("/transactions")
def create_transaction(
    body: CreateTransactionRequest,
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    from app.models.financial_event import FinancialEvent
    from datetime import datetime

    INCOME_CATS = {"revenue", "income"}
    event_type = "income" if body.category in INCOME_CATS else "expense"

    event = FinancialEvent(
        user_id=user["id"],
        vendor=body.vendor,
        amount=body.amount,
        category=body.category,
        currency="EUR",
        event_date=datetime.strptime(body.event_date, "%Y-%m-%d"),
        is_recurring=body.is_recurring,
        event_type=event_type,
    )
    db.add(event)
    db.flush()

    _check_expense_alert(user["id"], db)

    db.commit()
    return {"ok": True, "id": event.id}


@router.patch("/transactions/{event_id}/recurring")
def toggle_recurring(
    event_id: int,
    is_recurring: bool = Query(...),
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    from app.models.financial_event import FinancialEvent
    event = db.query(FinancialEvent).filter(FinancialEvent.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    if event.user_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    event.is_recurring = is_recurring
    db.commit()
    return {"ok": True, "is_recurring": is_recurring}


@router.get("/forecast")
def get_forecast(
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    """Прогноз на следующий месяц на основе повторяющихся транзакций."""
    from app.models.financial_event import FinancialEvent
    from app.services.extraction import INCOME_CATEGORIES, EXPENSE_CATEGORIES

    recurring = db.query(FinancialEvent).filter(
        FinancialEvent.user_id == user["id"],
        FinancialEvent.is_recurring == True,  # noqa: E712
    ).all()

    income  = sum(e.amount or 0 for e in recurring if e.category in INCOME_CATEGORIES)
    expense = sum(e.amount or 0 for e in recurring if e.category in EXPENSE_CATEGORIES)
    tax     = sum(e.amount or 0 for e in recurring if e.category == "tax")

    return {
        "income":  round(income, 2),
        "expense": round(expense, 2),
        "tax":     round(tax, 2),
        "net":     round(income - expense - tax, 2),
        "count":   len(recurring),
    }


@router.patch("/documents/{doc_id}/payment-status")
def update_payment_status(
    doc_id: int,
    payment_status: str = Query(..., pattern="^(pending|paid|overdue)$"),
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    from app.models.document import Document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    doc.payment_status = payment_status
    db.commit()
    return {"ok": True, "payment_status": payment_status}


@router.get("/recommendations", response_model=List[Recommendation])
def get_recommendations(
    category: str = "general",
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    recs = get_mock_recommendations(user_id=user["id"])
    return recs
