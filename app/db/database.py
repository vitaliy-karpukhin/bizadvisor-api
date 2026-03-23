import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER','admin')}:{os.getenv('DB_PASSWORD','admin')}@{os.getenv('DB_HOST','db')}:{os.getenv('DB_PORT','5432')}/{os.getenv('DB_NAME','bizadvisor')}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from app.models import User, Document, FinancialEvent  # noqa: F401

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()