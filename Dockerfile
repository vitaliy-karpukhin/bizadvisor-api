# Stage 1: build React frontend
FROM node:20-slim AS frontend
WORKDIR /frontend
COPY truevision-frontend/package*.json ./
RUN npm ci
COPY truevision-frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y gcc libpq-dev build-essential \
        tesseract-ocr tesseract-ocr-deu tesseract-ocr-eng \
        libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Copy built frontend from Stage 1
COPY --from=frontend /frontend/dist ./truevision-frontend/dist

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
