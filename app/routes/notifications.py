from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.notification import Notification
from app.routes.dashboard import get_current_user_from_header

router = APIRouter()


@router.get("")
def list_notifications(
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    items = (
        db.query(Notification)
        .filter(Notification.user_id == user["id"])
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id":         n.id,
            "title":      n.title,
            "body":       n.body,
            "type":       n.type,
            "is_read":    n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in items
    ]


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user["id"],
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}


@router.patch("/read-all")
def mark_all_read(
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == user["id"],
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}


@router.delete("/clear", status_code=200)
def clear_all(
    user: dict = Depends(get_current_user_from_header),
    db:   Session = Depends(get_db),
):
    db.query(Notification).filter(Notification.user_id == user["id"]).delete()
    db.commit()
    return {"ok": True}
