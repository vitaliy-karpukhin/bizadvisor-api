from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.routes.dashboard import get_current_user_from_header
from app.services.analytics import calculate_project_margin
import logging

logger = logging.getLogger("projects")
router = APIRouter()


@router.post("/query")
def chat_bot(
    query: str,
    project_id: Optional[int] = None,
    user: dict = Depends(get_current_user_from_header),
    db: Session = Depends(get_db),
):
    role = user.get("role")

    financial_triggers = ["прибыль", "сколько заработал", "деньги", "margin"]

    if role != "admin" and any(word in query.lower() for word in financial_triggers):
        raise HTTPException(
            status_code=403, detail="Доступ к финансам запрещен. Обратитесь к шефу."
        )

    if "эффективность" in query.lower():
        if not project_id:
            raise HTTPException(status_code=400, detail="Укажите project_id для анализа эффективности")
        stats = calculate_project_margin(db, project_id=project_id)
        return {
            "answer": f"Проект сейчас имеет маржу {stats['margin']}%. Основная трата — материалы.",
            "recommendation": "Проверьте закупки у Hagebau, там цены выросли на 5%.",
        }

    return {"answer": "Я вижу ваши задачи: Объект А, установка кабеля до 17:00."}
