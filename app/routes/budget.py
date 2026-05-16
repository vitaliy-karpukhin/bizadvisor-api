from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter()

DEFAULT_BUDGET = {
    "income": 0,
    "categories": [
        {
            "id": "housing",
            "label": "Жильё",
            "color": "#4FD1C5",
            "items": [
                {"id": "h1", "label": "Аренда / ипотека",    "amount": 0},
                {"id": "h2", "label": "Коммунальные услуги", "amount": 0},
                {"id": "h3", "label": "Интернет / телефон",  "amount": 0},
            ],
        },
        {
            "id": "living",
            "label": "Жизнь и потребление",
            "color": "#68D391",
            "items": [
                {"id": "l1", "label": "Питание",        "amount": 0},
                {"id": "l2", "label": "Одежда",         "amount": 0},
                {"id": "l3", "label": "Транспорт",      "amount": 0},
                {"id": "l4", "label": "Развлечения",    "amount": 0},
            ],
        },
        {
            "id": "insurance",
            "label": "Страховки и взносы",
            "color": "#F6AD55",
            "items": [
                {"id": "i1", "label": "Медицинская страховка",  "amount": 0},
                {"id": "i2", "label": "Автострахование",        "amount": 0},
            ],
        },
        {
            "id": "savings",
            "label": "Сбережения",
            "color": "#B794F4",
            "items": [
                {"id": "s1", "label": "Накопительный счёт", "amount": 0},
                {"id": "s2", "label": "Инвестиции",         "amount": 0},
            ],
        },
    ],
}


def _get_user(authorization: Optional[str], db: Session) -> dict:
    if not authorization:
        raise HTTPException(401, "Authorization header missing")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(401, "User not found")
    return {"id": user.id, "email": user.email}


@router.get("")
def get_budget(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    row = db.query(Budget).filter(Budget.user_id == user["id"]).first()
    return row.data if row else DEFAULT_BUDGET


@router.put("")
def save_budget(
    body: dict,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    row = db.query(Budget).filter(Budget.user_id == user["id"]).first()
    if row:
        row.data = body
    else:
        row = Budget(user_id=user["id"], data=body)
        db.add(row)
    db.commit()
    return {"ok": True}
