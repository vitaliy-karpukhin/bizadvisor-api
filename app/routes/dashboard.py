from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import os
from app.config import SECRET_KEY, ALGORITHM
from app.services.extraction import calculate_dashboard_metrics
from app.services.ai import get_mock_recommendations
from app.db.database import SessionLocal
from app.models.user import User

router = APIRouter()

def get_current_user_from_header(
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(SessionLocal)
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
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }


class DashboardResponse(BaseModel):
    business_score: int
    income: float
    expenses: float
    recurring_obligations: float
    risk_level: str
    growth_potential: str

    class Config:
        from_attributes = True


class Recommendation(BaseModel):
    problem: str
    effect: str
    recommendation: str
    action_url: str

    class Config:
        from_attributes = True


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
        user: dict = Depends(get_current_user_from_header),
        db: Session = Depends(SessionLocal)
):
    metrics = calculate_dashboard_metrics({"id": user["id"]})
    return metrics


@router.get("/recommendations", response_model=List[Recommendation])
def get_recommendations(
        user: dict = Depends(get_current_user_from_header),
        db: Session = Depends(SessionLocal)
):
    recs = get_mock_recommendations(user_id=user["id"])
    return recs