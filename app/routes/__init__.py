from .auth import router as auth_router
from .upload import router as upload_router
from .documents import router as documents_router
from .dashboard import router as dashboard_router

__all__ = ["auth_router", "upload_router", "documents_router", "dashboard_router"]
