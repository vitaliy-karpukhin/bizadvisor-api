from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header, Request
from fastapi.responses import FileResponse
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document import Document
from app.models.user import User
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import os, shutil, uuid, logging, json
from werkzeug.utils import secure_filename
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
UPLOAD_DIR = "/app/uploads"


def _get_user_from_token(authorization: Optional[str], db: Session) -> dict:
    if not authorization:
        raise HTTPException(401, "Authorization header missing")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(401, "User not found")
    return {"id": user.id, "email": user.email, "role": user.role}


@router.post("/upload")
def upload_file(
        request: Request,
        file: UploadFile = File(...),
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(get_db)
):
    # === Читаем local_kw вручную ПОСЛЕ разрешения зависимостей ===
    local_kw = None
    query_string = request.scope.get("query_string", b"").decode()
    if "local_kw=" in query_string:
        import urllib.parse
        params = urllib.parse.parse_qs(query_string)
        if "local_kw" in params:
            try:
                local_kw = json.loads(params["local_kw"][0])
            except:
                local_kw = params["local_kw"][0]

    user = _get_user_from_token(authorization, db)

    filename = secure_filename(file.filename or "file")
    path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = Document(
        filename=filename,
        file_path=path,
        file_size=os.path.getsize(path),
        status="processed",
        language="de",
        extraction_result={"amount": 999.99, "category": "expense", "local_kw": local_kw},
        owner_id=user["id"]
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {"ok": True, "id": doc.id, "filename": filename, "msg": "FINAL_FIXED"}


@router.get("/", response_model=List[dict])
def list_documents(
        request: Request,
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(get_db)
):

    user = _get_user_from_token(authorization, db)
    docs = db.query(Document).filter(Document.owner_id == user["id"]).all()
    return [
        {
            "id": d.id, "filename": d.filename, "status": d.status,
            "language": d.language, "file_size": d.file_size,
            "created_at": d.created_at.isoformat() if d.created_at else None
        } for d in docs
    ]


@router.get("/{doc_id}")
def download_file(
        doc_id: int,
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(get_db)
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


@router.get("/{doc_id}/info")
def get_document_info(
        doc_id: int,
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(get_db)
):
    user = _get_user_from_token(authorization, db)
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "File not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    return {
        "id": doc.id, "filename": doc.filename, "status": doc.status,
        "language": doc.language, "file_size": doc.file_size,
        "file_path": doc.file_path, "extraction_result": doc.extraction_result,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None
    }


@router.delete("/{doc_id}")
def delete_file(
        doc_id: int,
        authorization: Optional[str] = Header(default=None),
        db: Session = Depends(get_db)
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