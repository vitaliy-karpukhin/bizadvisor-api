from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.project import Project
from app.config import SECRET_KEY, ALGORITHM
from app.models.user import User
from jose import jwt, JWTError
import logging

logger = logging.getLogger("projects")
router = APIRouter()


def _get_user_from_token(authorization: Optional[str], db: Session) -> dict:
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
    return {"id": user.id, "email": user.email, "role": payload.get("role")}


@router.post("/")
def create_project(
    name: str,
    description: str = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_token(authorization, db)
    new_project = Project(
        name=name, description=description, owner_id=current_user["id"]
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/")
def list_projects(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    current_user = _get_user_from_token(authorization, db)
    return db.query(Project).filter(Project.owner_id == current_user["id"]).all()


@router.get("/{project_id}")
def get_project(
    project_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_token(authorization, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user["id"])
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    return project


@router.put("/{project_id}")
def update_project(
    project_id: int,
    name: str = None,
    description: str = None,
    status: str = None,
    budget: float = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_token(authorization, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user["id"])
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    if status is not None:
        project.status = status
    if budget is not None:
        project.budget = budget
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = _get_user_from_token(authorization, db)
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user["id"])
        .first()
    )
    if not project:
        raise HTTPException(404, "Project not found")
    db.delete(project)
    db.commit()
    return {"message": f"Project {project_id} deleted"}
