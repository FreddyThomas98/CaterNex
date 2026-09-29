# Multi-stage Docker build for B & Co Wedding Events and Caters

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend with Unified Static Serving
FROM python:3.11-slim
WORKDIR /app

# Install minimal build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy assets and backend
COPY assets/ ./assets/
COPY backend/app/ ./backend/app/
COPY backend/catering.db ./backend/catering.db

# Copy built frontend distribution files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Cloud hosts (e.g. Render, Railway) inject PORT dynamically
ENV PORT=8000
EXPOSE 8000

WORKDIR /app/backend/app
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
