import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles

# Database
from app.db.database import engine, Base

# Импорт моделей (чтобы SQLAlchemy видел их при создании таблиц)
from app.models.user import User
from app.models.company import Company
from app.models.project import Project

# Routers
from app.routes import auth, protected, projects, dashboard, chat
from app.routes.upload import router as documents_router
from app.routes.company import router as company_router

# Логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. Инициализация FastAPI
app = FastAPI(
    title="TrueVision API",
    version="1.0.0",
    redirect_slashes=False,
)

# 2. Настройка CORS
_cors_raw = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Раздача статических файлов (АВАТАРКИ)
# Если папки нет, создаем ее, иначе StaticFiles вызовет ошибку
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 4. База данных и логи при старте
@app.on_event("startup")
async def startup_event():
    logger.info("Connecting to database and creating tables...")
    Base.metadata.create_all(bind=engine)
    # Меняем FK document_id → SET NULL чтобы финансовые записи
    # сохранялись после удаления документа
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE financial_events "
                "DROP CONSTRAINT IF EXISTS financial_events_document_id_fkey;"
            ))
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE financial_events "
                "ADD CONSTRAINT financial_events_document_id_fkey "
                "FOREIGN KEY (document_id) REFERENCES documents(id) "
                "ON DELETE SET NULL;"
            ))
            conn.commit()
        logger.info("FK financial_events.document_id set to ON DELETE SET NULL")
    except Exception as e:
        logger.warning(f"FK migration skipped: {e}")
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
                "payment_status VARCHAR DEFAULT 'pending';"
            ))
            conn.commit()
        logger.info("Column documents.payment_status ensured")
    except Exception as e:
        logger.warning(f"payment_status migration skipped: {e}")
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash VARCHAR;"
            ))
            conn.commit()
        logger.info("Column documents.file_hash ensured")
    except Exception as e:
        logger.warning(f"file_hash migration skipped: {e}")
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE financial_events ADD COLUMN IF NOT EXISTS "
                "is_recurring BOOLEAN DEFAULT FALSE;"
            ))
            conn.commit()
        logger.info("Column financial_events.is_recurring ensured")
    except Exception as e:
        logger.warning(f"is_recurring migration skipped: {e}")

    # 1. Автоматическая очистка дубликатов
    try:
        from sqlalchemy.orm import Session as _Session
        from app.models.document import Document as _Doc
        from app.models.financial_event import FinancialEvent as _FE
        from collections import defaultdict

        with _Session(engine) as db:
            docs = db.query(_Doc).order_by(_Doc.id).all()
            groups: dict = defaultdict(list)
            for doc in docs:
                key = doc.file_hash if doc.file_hash else (doc.filename + str(doc.owner_id))
                groups[key].append(doc)

            removed = 0
            for group in groups.values():
                if len(group) <= 1:
                    continue
                for doc in sorted(group, key=lambda d: d.id)[:-1]:
                    db.query(_FE).filter(_FE.document_id == doc.id).delete()
                    if doc.file_path and __import__("os").path.exists(doc.file_path):
                        __import__("os").remove(doc.file_path)
                    db.delete(doc)
                    removed += 1
            db.commit()
            if removed:
                logger.info(f"Auto-dedup: removed {removed} duplicate document(s)")
    except Exception as e:
        logger.warning(f"Auto-dedup skipped: {e}")


    logger.info("Application startup complete.")

# 5. Подключение роутеров
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(protected.router, prefix="/protected", tags=["protected"])
app.include_router(company_router, prefix="/company", tags=["company"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])

# 6. Swagger Security Config (чтобы кнопка Authorize работала)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="TrueVision API",
        version="1.0.0",
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {"type": "http", "scheme": "bearer"}
    }
    # Применяем авторизацию ко всем эндпоинтам в Swagger
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi

@app.get("/", tags=["Root"])
def root():
    return {"status": "running"}