import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Добавляем путь к приложению
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Импортируем базу и модели (проверь пути!)
from app.db.database import Base
from app.models.user import User
from app.models.document import Document
from app.models.financial_event import FinancialEvent
from app.models.project import Project
from app.models.labor import LaborEntry

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    # ПРЯМОЕ ПОЛУЧЕНИЕ ИЗ ОКРУЖЕНИЯ DOCKER
    user = os.getenv("DB_USER", "admin")
    password = os.getenv("DB_PASSWORD", "admin")
    host = os.getenv("DB_HOST", "db")
    port = os.getenv("DB_PORT", "5432")
    db = os.getenv("DB_NAME", "bizadvisor")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

def run_migrations_online() -> None:
    # Заменяем URL на тот, что собрали сами
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    # Для оффлайн режима тоже используем наш URL
    context.configure(url=get_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    run_migrations_online()