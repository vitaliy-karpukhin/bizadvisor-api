from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.document import Document
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
import logging
from app.config import SECRET_KEY, ALGORITHM

logger = logging.getLogger("documents")
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
UPLOAD_DIR = "/app/uploads"


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(SessionLocal)
):
    """Получает текущего пользователя из JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.user import User

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"id": user.id, "email": user.email, "role": getattr(user, "role", "user")}


# Список файлов текущего пользователя
@router.get("/", response_model=list)
def list_files(
    current_user: dict = Depends(get_current_user), db: Session = Depends(SessionLocal)
):
    """Возвращает список документов пользователя"""
    docs = db.query(Document).filter(Document.owner_id == current_user["id"]).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "status": d.status,
            "language": d.language,
            "created_at": d.created_at,
        }
        for d in docs
    ]


# Скачивание файла
@router.get("/{doc_id}")
def download_file(
    doc_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(SessionLocal),
):
    """Скачивает файл по ID"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    if doc.owner_id != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to access this file")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(doc.file_path, filename=doc.filename)


# Удаление файла
@router.delete("/{doc_id}")
def delete_file(
    doc_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(SessionLocal),
):
    """Удаляет файл по ID"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    if doc.owner_id != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this file")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    logger.info(f"User {current_user['email']} deleted file {doc.filename}")
    return {"detail": "File deleted"}


# Получение одного документа
@router.get("/{doc_id}/info")
def get_document_info(
    doc_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(SessionLocal),
):
    """Возвращает метаданные документа"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    if doc.owner_id != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to access this file")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "language": doc.language,
        "file_size": doc.file_size,
        "file_path": doc.file_path,
        "extraction_result": doc.extraction_result,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }
