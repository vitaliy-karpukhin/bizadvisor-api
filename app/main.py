from fastapi import FastAPI
import logging
from fastapi.openapi.utils import get_openapi

# Database
from app.db.database import engine, Base

# Импорт моделей
from app.models import User, Document, FinancialEvent  # noqa: F401

# Routers
from app.routes import auth, protected, dashboard
from app.routes.upload import router as documents_router

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI instance
app = FastAPI(
    title="BizAdvisor API",
    description="AI-powered Business Advisor Platform",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

# Создаём таблицы
Base.metadata.create_all(bind=engine)
logger.info("Database tables created or already exist.")

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(protected.router, prefix="/protected", tags=["protected"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

# Bearer Auth для Swagger
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="BizAdvisor API",
        description="AI-powered Business Advisor Platform",
        version="1.0.0",
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
        }
    }
    schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi

# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {"status": "API running", "message": "Welcome to BizAdvisor API!"}

# Startup / Shutdown
@app.on_event("startup")
async def startup_event():
    logger.info("Starting BizAdvisor API server...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down BizAdvisor API server...")