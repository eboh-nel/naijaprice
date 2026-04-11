# NaijaPrice

**Compare product prices across Nigerian online stores — Jumia, Konga, Kara, and more.**

Built with Next.js 14 + FastAPI + PostgreSQL + Celery + Playwright.

---

## Project Structure

```
naijaprice/
├── backend/          FastAPI API + scrapers + Celery workers
├── frontend/         Next.js 14 App Router frontend
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
# 1. Clone and enter project
git clone <your-repo>
cd naijaprice

# 2. Copy and fill in env files
cp backend/.env.example backend/.env

# 3. Start everything
docker compose up --build

# 4. Run DB migrations
docker compose exec api alembic upgrade head

# 5. Seed stores and categories
docker compose exec api python seed.py

# 6. Install Playwright browsers (first time only)
docker compose exec api playwright install chromium
```

Then visit:
- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs
- **Admin**: http://localhost:3000/admin

---

## Local Dev (without Docker)

### Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate

# Install deps
pip install -r requirements.txt
playwright install chromium

# Copy env
cp .env.example .env
# Edit DATABASE_URL and REDIS_URL in .env

# Run migrations
alembic upgrade head

# Seed data
python seed.py

# Start API
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.scrape_tasks.celery worker --loglevel=info

# Start Celery beat scheduler (separate terminal)
celery -A app.tasks.scrape_tasks.celery beat --loglevel=info
```

### Frontend

```bash
cd frontend

# Install deps
npm install

# Copy env
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

---

## How It Works

### Scraping flow

```
Celery Beat (schedule)
    → run_scraper task
        → Store-specific scraper (Jumia / Konga / Kara)
            → discover_product_urls()   (category pages)
            → scrape_product(url)       (product page)
        → Save Listing + Price to DB
        → match_and_save()
            → exact variant_key match
            → fuzzy match fallback
            → create new product/variant
            → or queue for admin review
```

### Product matching

Products are matched by building a `variant_key` like:

```
SAMSUNG|GALAXY A15|128GB|4GB
```

Exact key → instant match.
Near match (≥75% similarity) → auto-linked.
Low confidence → sent to admin review queue at `/admin`.

### Price history

Every scrape compares the new price to the last saved price. A new `Price` row is inserted only when the price changes, keeping history lean.

---

## Adding a New Scraper

1. Create `backend/app/scrapers/yourstore.py`
2. Inherit from `BaseScraper`
3. Implement `discover_product_urls()` and `scrape_product()`
4. Add it to `SCRAPER_MAP` in `scrape_tasks.py`
5. Add a beat schedule entry
6. Add the store to `seed.py`

```python
class YourStoreScraper(BaseScraper):
    store_name = "YourStore"
    base_url = "https://yourstore.com.ng"

    async def discover_product_urls(self) -> list[str]:
        # visit category pages, return product URLs
        ...

    async def scrape_product(self, url: str) -> dict | None:
        # visit product page, return raw dict
        return {
            "store": self.store_name,
            "title": "...",
            "price": 123456.0,
            "old_price": None,
            "currency": "NGN",
            "stock_status": "in_stock",
            "product_url": url,
            "image_url": "...",
            "seller_name": None,
        }
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=...` | Full-text product search |
| GET | `/api/products/{slug}` | Product detail + comparison |
| GET | `/api/stores` | List all stores |
| GET | `/api/admin/unmatched` | Unmatched listings queue |
| POST | `/api/admin/match/{id}?variant_id=X` | Approve a match |
| POST | `/api/admin/reject/{id}` | Reject a match |
| GET | `/api/admin/scrape-jobs` | Recent scrape jobs |
| POST | `/api/admin/run-scraper/{store}` | Trigger a scraper |

Full interactive docs at: `http://localhost:8000/docs`

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Home with search + categories + price drops |
| `/search?q=...` | Search results with filters |
| `/product/[slug]` | Product detail, comparison table, price chart |
| `/category/[slug]` | Category listing |
| `/stores` | All tracked stores |
| `/admin` | Admin dashboard (match review + scraper controls) |
| `/sitemap.xml` | Auto-generated sitemap for Google |
| `/robots.txt` | Search engine crawler rules |

---

## SEO

- `app/sitemap.ts` — dynamic sitemap, pulls live product slugs from API
- `app/robots.ts` — allows crawling of public pages, blocks `/admin` and `/api`
- `generateMetadata()` on each page — custom title + description + canonical URL
- Clean URLs: `/product/samsung-galaxy-a15-128gb`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy 2, Alembic |
| Database | PostgreSQL |
| Scraping | Playwright, BeautifulSoup |
| Queue | Celery + Redis |
| Deployment | Vercel (frontend), Render/Railway (backend), Neon (DB) |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
vercel deploy
# Set NEXT_PUBLIC_API_URL to your backend URL in Vercel env vars
```

### Backend → Render / Railway

- Point to `backend/` directory
- Set env vars from `.env.example`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add a separate worker service: `celery -A app.tasks.scrape_tasks.celery worker`
- Add a beat service: `celery -A app.tasks.scrape_tasks.celery beat`

### Database → Neon or Supabase

- Create a PostgreSQL instance
- Paste the connection string as `DATABASE_URL`
- Run `alembic upgrade head` once after deploy

---

## Roadmap

**Phase 1 (MVP — Week 1–2)**
- [x] DB schema + migrations
- [x] Jumia + Konga scrapers
- [x] Normalization + matching
- [x] Search + product API
- [x] Search results page
- [x] Product comparison page

**Phase 2 (Week 3–4)**
- [ ] Price history chart (live data)
- [ ] Admin review page (live)
- [ ] Third store scraper (Kara / Slot)
- [ ] Price drop detection + email alerts
- [ ] Saved watchlist

**Phase 3 (After launch)**
- [ ] WhatsApp price alerts
- [ ] Browser extension
- [ ] Mobile app
- [ ] ML-assisted product matching
- [ ] User-submitted prices

---

## Legal Note

Always respect each store's `robots.txt` and Terms of Service. This project uses polite rate limits, random delays, and avoids restricted paths (cart, checkout, account, internal APIs). Use responsibly.
