import asyncio
from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app.models import Store, Listing, Price, ScrapeJob, ScrapeJobStatus
from app.services.matching import match_and_save
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

celery = Celery("naijaprice", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery.conf.beat_schedule = {
    "scrape-jumia-every-4h": {
        "task": "app.tasks.scrape_tasks.run_scraper",
        "schedule": 60 * 60 * 4,
        "args": ("jumia",),
    },
    "scrape-konga-every-4h": {
        "task": "app.tasks.scrape_tasks.run_scraper",
        "schedule": 60 * 60 * 4,
        "args": ("konga",),
    },
}

SCRAPER_MAP = {
    "jumia": "app.scrapers.jumia.JumiaScraper",
    "konga": "app.scrapers.konga.KongaScraper",
}


def _load_scraper(store_slug: str):
    module_path, class_name = SCRAPER_MAP[store_slug].rsplit(".", 1)
    import importlib
    module = importlib.import_module(module_path)
    return getattr(module, class_name)()


@celery.task
def run_scraper(store_slug: str):
    db = SessionLocal()
    try:
        store = db.query(Store).filter(Store.slug == store_slug, Store.is_active == True).first()
        if not store:
            logger.warning(f"Store not found or inactive: {store_slug}")
            return

        job = ScrapeJob(
            store_id=store.id,
            status=ScrapeJobStatus.running,
            started_at=datetime.utcnow(),
        )
        db.add(job)
        db.commit()

        scraper = _load_scraper(store_slug)
        raw_products = asyncio.run(scraper.run())

        pages_scraped = len(raw_products)
        errors = 0

        for raw in raw_products:
            try:
                # Upsert listing
                listing = (
                    db.query(Listing)
                    .filter(
                        Listing.store_id == store.id,
                        Listing.product_url == raw["product_url"],
                    )
                    .first()
                )
                if not listing:
                    listing = Listing(
                        store_id=store.id,
                        title=raw["title"],
                        product_url=raw["product_url"],
                        image_url=raw.get("image_url"),
                        seller_name=raw.get("seller_name"),
                        stock_status=raw.get("stock_status", "unknown"),
                    )
                    db.add(listing)
                    db.flush()
                else:
                    listing.title = raw["title"]
                    listing.image_url = raw.get("image_url")
                    listing.seller_name = raw.get("seller_name")
                    listing.stock_status = raw.get("stock_status", "unknown")

                listing.last_seen_at = datetime.utcnow()
                db.flush()

                # Save price if changed
                latest_price = listing.prices[0] if listing.prices else None
                if not latest_price or latest_price.price != raw["price"]:
                    p = Price(
                        listing_id=listing.id,
                        price=raw["price"],
                        old_price=raw.get("old_price"),
                        currency=raw.get("currency", "NGN"),
                    )
                    db.add(p)

                # Match to product variant
                if not listing.product_variant_id:
                    match_and_save(db, raw, store.id, listing)

                db.commit()
            except Exception as e:
                errors += 1
                db.rollback()
                logger.warning(f"Error saving product: {e}")

        job.status = ScrapeJobStatus.completed
        job.finished_at = datetime.utcnow()
        job.pages_scraped = pages_scraped
        job.errors_count = errors
        db.commit()
        logger.info(f"[{store_slug}] Job complete: {pages_scraped} scraped, {errors} errors")

    except Exception as e:
        if job:
            job.status = ScrapeJobStatus.failed
            job.finished_at = datetime.utcnow()
            db.commit()
        logger.error(f"Scraper job failed for {store_slug}: {e}")
        raise
    finally:
        db.close()
