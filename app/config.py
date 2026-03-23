import os
from dotenv import load_dotenv
load_dotenv()

# Настройки БД
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin")
DB_NAME = os.getenv("DB_NAME", "bizadvisor")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")

# Настройки безопасности
SECRET_KEY = os.getenv("SECRET_KEY", "mysupersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Прочее
UPLOAD_TOKEN = os.getenv("UPLOAD_TOKEN", "supersecrettoken123")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
