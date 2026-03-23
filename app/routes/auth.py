from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.dependencies.auth import hash_password, verify_password, create_access_token

router = APIRouter()

MAX_BCRYPT_LENGTH = 72  # безопасная длина пароля для bcrypt

@router.post("/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(email=email, password=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"id": user.id, "email": user.email}
    except Exception as e:
        # Логируем реальную ошибку
        import traceback, logging
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        # Обрезаем пароль для проверки
        safe_password = form_data.password[:MAX_BCRYPT_LENGTH]

        if not verify_password(safe_password, user.password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")

        token = create_access_token({"sub": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        print("ERROR in /login:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")