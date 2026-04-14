.PHONY: help up down build logs migrate seed scrape-jumia scrape-konga scrape-kara dev-backend dev-frontend test lint

help:
	@echo ""
	@echo "NaijaPrice – Available Commands"
	@echo "================================"
	@echo "  make up              Start all Docker services"
	@echo "  make down            Stop all Docker services"
	@echo "  make build           Rebuild Docker images"
	@echo "  make logs            Tail all service logs"
	@echo "  make migrate         Run database migrations"
	@echo "  make seed            Seed stores and categories"
	@echo "  make setup           Full first-time setup (migrate + seed)"
	@echo ""
	@echo "  make scrape-jumia    Trigger Jumia scraper via API"
	@echo "  make scrape-konga    Trigger Konga scraper via API"
	@echo "  make scrape-kara     Trigger Kara scraper via API"
	@echo "  make scrape-all      Trigger all scrapers"
	@echo ""
	@echo "  make dev-backend     Run backend without Docker (needs venv)"
	@echo "  make dev-frontend    Run frontend without Docker"
	@echo "  make test            Run backend tests"
	@echo "  make lint            Lint backend code"
	@echo ""

# ── Docker ───────────────────────────────────────────────────────────────────

up:
	docker compose up

up-d:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up --build

logs:
	docker compose logs -f

restart:
	docker compose restart api worker beat

# ── Database ─────────────────────────────────────────────────────────────────

migrate:
	docker compose exec api alembic upgrade head

migrate-new:
	@read -p "Migration name: " name; \
	docker compose exec api alembic revision --autogenerate -m "$$name"

migrate-down:
	docker compose exec api alembic downgrade -1

seed:
	docker compose exec api python seed.py

setup: migrate seed
	@echo "✅ Database ready."

# ── Scrapers ─────────────────────────────────────────────────────────────────

scrape-jumia:
	curl -s -X POST http://localhost:8000/api/admin/run-scraper/jumia | python3 -m json.tool

scrape-konga:
	curl -s -X POST http://localhost:8000/api/admin/run-scraper/konga | python3 -m json.tool

scrape-kara:
	curl -s -X POST http://localhost:8000/api/admin/run-scraper/kara | python3 -m json.tool

scrape-all: scrape-jumia scrape-konga scrape-kara

# ── Local Dev (no Docker) ────────────────────────────────────────────────────

dev-backend:
	cd backend && \
	source venv/bin/activate && \
	uvicorn app.main:app --reload --port 8000

dev-worker:
	cd backend && \
	source venv/bin/activate && \
	celery -A app.tasks.scrape_tasks.celery worker --loglevel=info

dev-beat:
	cd backend && \
	source venv/bin/activate && \
	celery -A app.tasks.scrape_tasks.celery beat --loglevel=info

dev-frontend:
	cd frontend && npm run dev

# ── Quality ───────────────────────────────────────────────────────────────────

test:
	docker compose exec api pytest tests/ -v

lint:
	docker compose exec api ruff check app/

install-backend:
	cd backend && \
	python -m venv venv && \
	source venv/bin/activate && \
	pip install -r requirements.txt && \
	playwright install chromium

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend
