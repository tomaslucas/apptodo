# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend source
COPY app/frontend/package.json app/frontend/bun.lock* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY app/frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM python:3.12-slim AS backend-builder

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY app/backend/pyproject.toml app/backend/uv.lock* ./

# Install Python dependencies with uv
RUN pip install uv && uv venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

RUN uv sync --no-dev

# Stage 3: Production runtime
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend from builder
COPY --from=backend-builder /opt/venv /opt/venv

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source
COPY app/backend ./backend

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATABASE_URL="sqlite:///./data/app.db" \
    DEBUG=False

# Create data directory
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
