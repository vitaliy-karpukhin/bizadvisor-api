from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.document import Document
from app.models.financial_event import FinancialEvent
from app.config import SECRET_KEY, ALGORITHM, OPENAI_API_KEY
from jose import jwt, JWTError
from app.models.user import User
import openai
import base64
import os

router = APIRouter()

openai.api_key = OPENAI_API_KEY


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


SYSTEM_PROMPT = """
Du bist ein KI-Finanzanalyst für deutsche Handwerksbetriebe.
Analysiere das gegebene Dokument und extrahiere strukturierte Finanzdaten.

Antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "document_type": "invoice|contract|report|unknown",
  "vendor": "Name des Lieferanten oder null",
  "amount": 1234.56,
  "currency": "EUR",
  "date": "2024-01-15 oder null",
  "category": "materials|personnel|rent|insurance|software|revenue|unknown",
  "description": "Kurze Beschreibung auf Deutsch",
  "optimization_hint": "Mögliche Einsparung oder Optimierung auf Deutsch oder null"
}
"""


@router.post("/{doc_id}/analyze")
def analyze_document(
    doc_id: int,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    user = _get_user_from_token(authorization, db)

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.owner_id != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    if not os.path.exists(doc.file_path):
        raise HTTPException(404, "File not found on disk")

    # Читаем файл и кодируем в base64
    with open(doc.file_path, "rb") as f:
        file_bytes = f.read()
    file_b64 = base64.standard_b64encode(file_bytes).decode("utf-8")

    # Вызов OpenAI
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Analysiere dieses Dokument: {doc.filename}"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:application/pdf;base64,{file_b64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        result = response.choices[0].message.content
        import json
        extracted = json.loads(result)
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

    # Сохраняем в Document
    doc.extraction_result = extracted
    doc.status = "analyzed"

    # Сохраняем в FinancialEvent
    from datetime import datetime
    event = FinancialEvent(
        user_id=user["id"],
        document_id=doc.id,
        event_type=extracted.get("document_type", "unknown"),
        vendor=extracted.get("vendor"),
        amount=extracted.get("amount"),
        currency=extracted.get("currency", "EUR"),
        category=extracted.get("category", "unknown"),
        event_date=datetime.now(),
    )
    db.add(event)
    db.commit()
    db.refresh(doc)

    return {
        "ok": True,
        "doc_id": doc.id,
        "status": "analyzed",
        "result": extracted
    }