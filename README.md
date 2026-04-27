# BizAdvisor API

AI-powered Business Advisor Platform для немецких ремесленных предприятий (Handwerk).

Платформа автоматически анализирует финансовые документы, извлекает финансовые данные и формирует бизнес-аналитику для малого и среднего бизнеса.

---

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Backend | FastAPI (Python 3.11) |
| База данных | PostgreSQL 15 |
| ORM | SQLAlchemy |
| Миграции | Alembic |
| Аутентификация | JWT (python-jose) |
| Хэширование паролей | bcrypt (passlib) |
| AI-анализ | OpenAI GPT-4o + GPT-4o-mini |
| PDF парсинг | pdfplumber |
| Определение языка | langdetect |
| Инфраструктура | Docker + Docker Compose |
| ASGI сервер | Uvicorn |

---

## Структура проекта

```
bizadvisor-api/
├── app/
│   ├── main.py                      # Точка входа, FastAPI instance, роутеры, Swagger Bearer Auth
│   ├── config.py                    # Конфигурация из .env (SECRET_KEY, ALGORITHM, OPENAI_API_KEY и др.)
│   ├── db/
│   │   └── database.py              # SQLAlchemy engine, SessionLocal, Base, get_db()
│   ├── models/
│   │   ├── __init__.py              # Экспорт всех моделей
│   │   ├── user.py                  # Модель пользователя
│   │   ├── document.py              # Модель документа
│   │   ├── project.py               # Модель проекта
│   │   └── financial_event.py       # Модель финансового события
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                  # POST /auth/register, POST /auth/login
│   │   ├── protected.py             # Защищённые роуты по ролям
│   │   ├── upload.py                # Загрузка, список, скачивание, удаление документов
│   │   ├── documents.py             # Альтернативный роутер документов (OAuth2PasswordBearer)
│   │   ├── projects.py              # CRUD /projects — управление проектами
│   │   ├── analysis.py              # POST /documents/{doc_id}/analyze — AI-анализ через GPT-4o
│   │   └── dashboard.py             # GET /dashboard — бизнес-метрики
│   ├── services/
│   │   ├── ai.py                    # OpenAI клиент: extract_with_ai(), get_mock_recommendations()
│   │   ├── document_processor.py    # Полный пайплайн обработки: текст → язык → данные → БД
│   │   ├── extraction.py            # PDF парсинг (pdfplumber), определение языка, regex-извлечение
│   │   └── event_builder.py         # Создание записей FinancialEvent из рекомендаций
│   ├── dependencies/
│   │   └── auth.py                  # hash_password(), verify_password(), create_access_token()
│   ├── schemas/
│   │   └── document.py              # Pydantic схемы для документов
│   └── utils/
│       └── auth.py                  # Вспомогательные утилиты авторизации
├── migrations/
│   ├── env.py                       # Конфигурация Alembic
│   └── migrate_owner_id.sql         # SQL миграция для поля owner_id
├── uploads/                         # Загруженные файлы (не в git)
├── docker-compose.yml
├── Dockerfile
├── alembic.ini
├── requirements.txt
└── .env                             # Переменные окружения (не в git)
```

---

## Переменные окружения (.env)

```env
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=bizadvisor
DB_HOST=db
DB_PORT=5432
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
OPENAI_API_KEY=sk-...
UPLOAD_TOKEN=your_upload_token
```

---

## Запуск проекта

```bash
# Клонировать репозиторий
git clone https://github.com/username/bizadvisor-api.git
cd bizadvisor-api

# Создать .env файл на основе примера выше

# Запустить контейнеры
docker compose up --build

# API доступен на:   http://localhost:8000
# Swagger UI:        http://localhost:8000/docs
```

---

## API Endpoints

### Аутентификация `/auth`

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/auth/register` | Регистрация нового пользователя | Публичный |
| POST | `/auth/login` | Логин, возвращает JWT токен | Публичный |

```bash
# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -d "email=user@example.com&password=secret"

# Логин
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=secret"
# → {"access_token": "eyJ...", "token_type": "bearer"}

# Сохранить токен в переменную
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=secret" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

---

### Защищённые роуты `/protected`

Все роуты требуют заголовок `Authorization: Bearer <token>`

| Метод | Endpoint | Описание | Роль |
|-------|----------|----------|------|
| GET | `/protected/me` | Данные текущего пользователя | Все |
| GET | `/protected/client-only` | Только для клиентов | client |
| GET | `/protected/partner-only` | Только для партнёров | partner |
| GET | `/protected/admin-only` | Только для администраторов | admin |

---

### Проекты `/projects`

Все роуты требуют `Authorization: Bearer <token>`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/projects/` | Создать новый проект |
| GET | `/projects/` | Список всех проектов пользователя |
| GET | `/projects/{project_id}` | Получить проект по ID |
| PUT | `/projects/{project_id}` | Обновить проект |
| DELETE | `/projects/{project_id}` | Удалить проект |

```bash
# Создать проект
curl -X POST "http://localhost:8000/projects/?name=Haus+Mueller&description=Renovierung+Badezimmer" \
  -H "Authorization: Bearer $TOKEN"
# → {"id": 1, "name": "Haus Mueller", "description": "Renovierung Badezimmer", "budget": 0.0, "status": "active", "owner_id": 9, ...}

# Список проектов
curl "http://localhost:8000/projects/" \
  -H "Authorization: Bearer $TOKEN"

# Получить проект по ID
curl "http://localhost:8000/projects/1" \
  -H "Authorization: Bearer $TOKEN"

# Обновить проект
curl -X PUT "http://localhost:8000/projects/1?name=Haus+Mueller+Updated&status=completed&budget=15000" \
  -H "Authorization: Bearer $TOKEN"

# Удалить проект
curl -X DELETE "http://localhost:8000/projects/1" \
  -H "Authorization: Bearer $TOKEN"
# → {"message": "Project 1 deleted"}
```

---

### Документы `/documents`

Все роуты требуют `Authorization: Bearer <token>`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/documents/upload` | Загрузить файл (PDF, изображение) |
| GET | `/documents/` | Список всех документов пользователя |
| GET | `/documents/{doc_id}` | Скачать файл |
| GET | `/documents/{doc_id}/info` | Метаданные + результат анализа |
| DELETE | `/documents/{doc_id}` | Удалить документ и файл с диска |
| POST | `/documents/{doc_id}/analyze` | Запустить AI-анализ через GPT-4o |

```bash
# Загрузка документа
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invoice.pdf"
# → {"ok": true, "id": 1, "filename": "invoice.pdf"}

# Список документов
curl http://localhost:8000/documents/ \
  -H "Authorization: Bearer $TOKEN"

# Информация о документе (включает extraction_result)
curl http://localhost:8000/documents/1/info \
  -H "Authorization: Bearer $TOKEN"

# Запустить AI-анализ
curl -X POST http://localhost:8000/documents/1/analyze \
  -H "Authorization: Bearer $TOKEN"
```

---

### AI-анализ `POST /documents/{doc_id}/analyze`

Отправляет PDF в OpenAI GPT-4o и извлекает структурированные финансовые данные.

Системный промпт оптимизирован для немецких Handwerk-документов (счета, договоры, отчёты).

Пример ответа:
```json
{
  "ok": true,
  "doc_id": 1,
  "status": "analyzed",
  "result": {
    "document_type": "invoice",
    "vendor": "Test Vendor GmbH",
    "amount": 1963.50,
    "currency": "EUR",
    "date": "2024-03-15",
    "category": "materials",
    "description": "Rechnung für Beratungsservices und Software-Lizenz",
    "optimization_hint": "Software-Lizenz könnte günstiger abonniert werden"
  }
}
```

Результат автоматически сохраняется в:
- `Document.extraction_result` (JSON поле)
- `Document.status` → `"analyzed"`
- Новая запись `FinancialEvent` в БД

---

### Dashboard `/dashboard`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/dashboard/` | Бизнес-метрики на основе всех документов пользователя |

Метрики рассчитываются по всем проанализированным документам пользователя:

```json
{
  "business_score": 78,
  "income": 82000.00,
  "expenses": 26000.00,
  "recurring_obligations": 6500.00,
  "risk_level": "low",
  "growth_potential": "high",
  "documents_analyzed": 12
}
```

---

## Сервисный слой (`app/services/`)

### `ai.py` — OpenAI интеграция
- `extract_with_ai(text, language)` — вызов GPT-4o-mini для извлечения финансовых данных. Промпт на немецком или английском в зависимости от языка документа.
- `get_mock_recommendations(user_id)` — временные mock-рекомендации (будут заменены на реальный AI).

### `document_processor.py` — Пайплайн обработки документа
Полный цикл в 6 шагов:
1. Извлечение текста из файла
2. Определение языка (de / en / unknown)
3. Извлечение финансовых данных через regex
4. Сохранение `extraction_result` в БД, статус → `"processed"`
5. Генерация рекомендаций
6. Создание записей `FinancialEvent`

При ошибке: статус документа → `"processing_failed"`, ошибка пишется в `extraction_result`.

### `extraction.py` — Парсинг и извлечение данных
- `extract_text_from_pdf(file_path)` — извлечение текста через `pdfplumber`
- `detect_language(text)` — определение языка через `langdetect`
- `extract_financial_data(text, language)` — regex-извлечение суммы, категории, поставщика. Поддерживает немецкий (1.234,56 €) и английский (€1,234.56) форматы сумм.
- `calculate_dashboard_metrics(current_user)` — агрегация income/expenses по всем документам, расчёт business_score, risk_level, growth_potential
- `process_document_extraction(document, file_path)` — единая точка входа для пайплайна

### `event_builder.py` — Финансовые события
- `build_financial_event(document, db, recommendations)` — создаёт записи `FinancialEvent` на основе рекомендаций, привязанные к документу и пользователю

---

## Модели данных

### User
```
id             Int        первичный ключ
email          String     уникальный, обязательный
password       String     bcrypt хэш
role           String     "user" | "client" | "partner" | "admin"
first_name     String     необязательный
last_name      String     необязательный
phone          String     необязательный
is_active      Boolean    default: True
is_verified    Boolean    default: False
created_at     DateTime   автоматически (timezone-aware)
updated_at     DateTime   автоматически (timezone-aware)
```

### Project
```
id             Int        первичный ключ
name           String     название проекта (например, "Haus Müller"), обязательный
address        String     адрес объекта, необязательный
description    Text       описание работ, необязательный
budget         Float      сумма контракта с клиентом, default: 0.0
status         String     "active" | "completed" | "archived", default: "active"
owner_id       Int        FK → users.id
created_at     DateTime   автоматически
```

### Document
```
id                 Int        первичный ключ
filename           String     имя файла
file_path          String     абсолютный путь на диске (/app/uploads/...)
file_size          BigInt     размер в байтах
status             String     "uploaded" | "processed" | "analyzed" | "processing_failed"
language           String     "de" | "en" | "unknown"
extraction_result  JSON       результат анализа: amount, category, vendor, currency, text, confidence
owner_id           Int        FK → users.id
created_at         DateTime   автоматически
updated_at         DateTime   автоматически
```

### FinancialEvent
```
id             Int        первичный ключ
user_id        Int        FK → users.id
document_id    Int        FK → documents.id
project_id     Int        FK → projects.id, необязательный
event_type     String     "invoice" | "contract" | "report" | "unknown"
vendor         String     название поставщика или клиента
amount         Float      сумма
currency       String     "EUR"
category       String     "materials" | "personnel" | "rent" | "insurance" | "software" | "revenue"
event_date     DateTime   дата события
created_at     DateTime   автоматически
```

---

## Роли пользователей

| Роль | Описание |
|------|----------|
| `user` | Базовый пользователь (по умолчанию при регистрации) |
| `client` | Клиент платформы — видит свои документы и аналитику |
| `partner` | Партнёр — видит документы своих клиентов |
| `admin` | Администратор — полный доступ ко всем данным |

---

## Swagger UI

После запуска открой [http://localhost:8000/docs](http://localhost:8000/docs)

1. Нажми `POST /auth/login` → введи `username` и `password` → Execute
2. Скопируй `access_token` из ответа
3. Нажми кнопку **Authorize 🔒** вверху страницы
4. Введи токен в поле Value → **Authorize**
5. Все защищённые эндпоинты становятся доступны автоматически

---

## Статус проекта

| Компонент | Статус |
|-----------|--------|
| Аутентификация (JWT + bcrypt) | ✅ Готово |
| Role-based access control | ✅ Готово |
| Загрузка и управление документами | ✅ Готово |
| Управление проектами (CRUD) | ✅ Готово |
| PDF парсинг (pdfplumber) | ✅ Готово |
| Определение языка документа | ✅ Готово |
| Regex-извлечение финансовых данных | ✅ Готово |
| AI-анализ через GPT-4o | ✅ Готово |
| Dashboard метрики | ✅ Готово |
| Swagger Bearer Auth | ✅ Готово |
| Миграции (Alembic) | ✅ Готово |
| Модель Company (Onboarding) | 📋 Запланировано |
| Business Score (продвинутый расчёт) | 📋 Запланировано |
| Партнёрский доступ к клиентам | 📋 Запланировано |
| Frontend (7 экранов) | 📋 Запланировано |