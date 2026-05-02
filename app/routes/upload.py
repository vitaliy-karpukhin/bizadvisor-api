from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header, Request
from fastapi.responses import FileResponse
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import os, shutil, uuid, logging, json, hashlib
from werkzeug.utils import secure_filename
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


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
    return {"id": user.id, "email": user.email, "role": user.role}


@router.post("/upload")
def upload_file(
    request: Request,
    file: UploadFile = File(...),
    project_id: Optional[int] = None,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    filename = secure_filename(file.filename or "file")

    # Читаем файл в память чтобы посчитать хэш
    file_bytes = file.file.read()
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # Проверка дубликата по хэшу содержимого
    existing = db.query(Document).filter(
        Document.owner_id == user["id"],
        Document.file_hash == file_hash,
    ).first()
    if existing:
        return {
            "ok": False,
            "duplicate": True,
            "existing_id": existing.id,
            "filename": existing.filename,
            "detail": f"Этот файл уже загружен как «{existing.filename}»",
        }

    path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(path, "wb") as f:
        f.write(file_bytes)
    doc = Document(
        filename=filename,
        file_path=path,
        file_size=len(file_bytes),
        file_hash=file_hash,
        status="uploaded",
        language="de",
        extraction_result={},
        owner_id=user["id"],
        project_id=project_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"ok": True, "id": doc.id, "filename": filename}


@router.get("", response_model=List[dict])
def list_documents(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    docs = db.query(Document).filter(Document.owner_id == user["id"]).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "status": d.status,
            "language": d.language,
            "file_size": d.file_size,
            "project_id": d.project_id,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "extraction_result": d.extraction_result or {},
            "payment_status": d.payment_status or "pending",
        }
        for d in docs
    ]


@router.get("/{doc_id}/info")
def get_document_info(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "File not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "language": doc.language,
        "file_size": doc.file_size,
        "file_path": doc.file_path,
        "extraction_result": doc.extraction_result,
        "project_id": doc.project_id,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


@router.post("/{doc_id}/analyze")
def analyze_document(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    try:
        from app.services.document_processor import process_document

        result = process_document(doc, db)
        doc.status = "analyzed"
        db.commit()
        db.refresh(doc)
        return {
            "ok": True,
            "doc_id": doc.id,
            "status": doc.status,
            "result": doc.extraction_result,
        }
    except Exception as e:
        doc.status = "processing_failed"
        doc.extraction_result = {"error": str(e)}
        db.commit()
        logger.error(f"Analysis failed for doc {doc_id}: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.get("/{doc_id}")
def download_file(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "File not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    if not os.path.exists(doc.file_path):
        raise HTTPException(404, "File not found on disk")
    return FileResponse(doc.file_path, filename=doc.filename)


@router.delete("/{doc_id}")
def delete_file(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_from_token(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "File not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"detail": "File deleted"}


@router.post("/deduplicate")
def deduplicate_documents(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Находит дубликаты (одинаковое имя файла или хэш) и удаляет более старые копии.
    Оставляет документ с наибольшим id (последний загруженный).
    """
    from app.models.financial_event import FinancialEvent
    from collections import defaultdict

    user = _get_user_from_token(authorization, db)
    docs = db.query(Document).filter(Document.owner_id == user["id"]).order_by(Document.id).all()

    # Группируем по хэшу (если есть) или по имени файла
    groups: dict = defaultdict(list)
    for doc in docs:
        key = doc.file_hash if doc.file_hash else doc.filename
        groups[key].append(doc)

    removed = 0
    for key, group in groups.items():
        if len(group) <= 1:
            continue
        # Оставляем последний (с наибольшим id), остальные удаляем
        to_delete = sorted(group, key=lambda d: d.id)[:-1]
        for doc in to_delete:
            # Удаляем связанные FinancialEvents
            db.query(FinancialEvent).filter(FinancialEvent.document_id == doc.id).delete()
            # Удаляем файл с диска
            if doc.file_path and os.path.exists(doc.file_path):
                os.remove(doc.file_path)
            db.delete(doc)
            removed += 1

    db.commit()
    return {"ok": True, "removed": removed}
