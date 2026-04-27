from sqlalchemy.orm import Session
from app.models.financial_event import FinancialEvent
from app.models.labor import LaborEntry


def calculate_project_margin(db: Session, project_id: int):
    # Собираем все доходы и расходы из документов
    events = (
        db.query(FinancialEvent).filter(FinancialEvent.project_id == project_id).all()
    )

    income = sum(e.amount for e in events if e.event_type == "income")
    material_costs = sum(e.amount for e in events if e.event_type == "expense")

    # Считаем стоимость работы (Labor Cost)
    labor = db.query(LaborEntry).filter(LaborEntry.project_id == project_id).all()
    total_hours = sum(l.hours for l in labor)
    labor_costs = total_hours * 45.0  # Средняя ставка мастера в час в EUR

    total_expenses = material_costs + labor_costs
    profit = income - total_expenses
    margin = (profit / income * 100) if income > 0 else 0

    return {
        "profit": profit,
        "margin": round(margin, 2),
        "hours_spent": total_hours,
        "is_profitable": margin > 20,  # В Handwerk маржа ниже 20% — риск
    }
