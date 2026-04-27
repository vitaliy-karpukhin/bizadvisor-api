from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.company import Company
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter()


def _get_user(authorization: Optional[str], db: Session) -> User:
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
    return user


@router.post("/onboarding")
def create_company(
    name: str,
    industry: Optional[str] = None,
    employees: Optional[int] = None,
    monthly_revenue: Optional[float] = None,
    active_projects: Optional[int] = None,
    material_costs: Optional[float] = None,
    personnel_costs: Optional[float] = None,
    fixed_costs: Optional[float] = None,
    software_accounting: Optional[str] = None,
    software_projects: Optional[str] = None,
    software_invoicing: Optional[str] = None,
    business_goal: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)

    # Проверяем не создана ли уже компания
    existing = db.query(Company).filter(Company.owner_id == user.id).first()
    if existing:
        raise HTTPException(400, "Company already exists for this user")

    company = Company(
        owner_id=user.id,
        name=name,
        industry=industry,
        employees=employees,
        monthly_revenue=monthly_revenue,
        active_projects=active_projects,
        material_costs=material_costs,
        personnel_costs=personnel_costs,
        fixed_costs=fixed_costs,
        software_accounting=software_accounting,
        software_projects=software_projects,
        software_invoicing=software_invoicing,
        business_goal=business_goal,
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    return {"ok": True, "company_id": company.id, "name": company.name}


@router.get("/me")
def get_my_company(
    authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)
):
    user = _get_user(authorization, db)
    company = db.query(Company).filter(Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(404, "Company not found. Please complete onboarding.")

    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "employees": company.employees,
        "monthly_revenue": company.monthly_revenue,
        "active_projects": company.active_projects,
        "material_costs": company.material_costs,
        "personnel_costs": company.personnel_costs,
        "fixed_costs": company.fixed_costs,
        "software_accounting": company.software_accounting,
        "software_projects": company.software_projects,
        "software_invoicing": company.software_invoicing,
        "business_goal": company.business_goal,
        "created_at": company.created_at.isoformat() if company.created_at else None,
    }


@router.put("/me")
def update_company(
    name: Optional[str] = None,
    industry: Optional[str] = None,
    employees: Optional[int] = None,
    monthly_revenue: Optional[float] = None,
    active_projects: Optional[int] = None,
    material_costs: Optional[float] = None,
    personnel_costs: Optional[float] = None,
    fixed_costs: Optional[float] = None,
    software_accounting: Optional[str] = None,
    software_projects: Optional[str] = None,
    software_invoicing: Optional[str] = None,
    business_goal: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    company = db.query(Company).filter(Company.owner_id == user.id).first()
    if not company:
        raise HTTPException(404, "Company not found")

    if name is not None:
        company.name = name
    if industry is not None:
        company.industry = industry
    if employees is not None:
        company.employees = employees
    if monthly_revenue is not None:
        company.monthly_revenue = monthly_revenue
    if active_projects is not None:
        company.active_projects = active_projects
    if material_costs is not None:
        company.material_costs = material_costs
    if personnel_costs is not None:
        company.personnel_costs = personnel_costs
    if fixed_costs is not None:
        company.fixed_costs = fixed_costs
    if software_accounting is not None:
        company.software_accounting = software_accounting
    if software_projects is not None:
        company.software_projects = software_projects
    if software_invoicing is not None:
        company.software_invoicing = software_invoicing
    if business_goal is not None:
        company.business_goal = business_goal

    db.commit()
    db.refresh(company)
    return {"ok": True, "company_id": company.id}
