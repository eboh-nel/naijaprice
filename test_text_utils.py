from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MatchReviewQueue, MatchReviewStatus, ScrapeJob, Listing
from datetime import datetime

router = APIRouter()


@router.get("/unmatched")
def get_unmatched(limit: int = 50, db: Session = Depends(get_db)):
    items = (
        db.query(MatchReviewQueue)
        .filter(MatchReviewQueue.status == MatchReviewStatus.pending)
        .limit(limit)
        .all()
    )
    result = []
    for item in items:
        listing = db.get(Listing, item.listing_id)
        result.append({
            "review_id": item.id,
            "listing_id": item.listing_id,
            "listing_title": listing.title if listing else None,
            "suggested_variant_id": item.suggested_variant_id,
            "confidence_score": item.confidence_score,
            "created_at": item.created_at,
        })
    return result


@router.post("/match/{review_id}")
def approve_match(review_id: int, variant_id: int, db: Session = Depends(get_db)):
    item = db.get(MatchReviewQueue, review_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    listing = db.get(Listing, item.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.product_variant_id = variant_id
    item.status = MatchReviewStatus.approved
    db.commit()
    return {"status": "matched", "listing_id": item.listing_id, "variant_id": variant_id}


@router.post("/reject/{review_id}")
def reject_match(review_id: int, db: Session = Depends(get_db)):
    item = db.get(MatchReviewQueue, review_id)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")
    item.status = MatchReviewStatus.rejected
    db.commit()
    return {"status": "rejected"}


@router.get("/scrape-jobs")
def list_scrape_jobs(limit: int = 20, db: Session = Depends(get_db)):
    return (
        db.query(ScrapeJob)
        .order_by(ScrapeJob.started_at.desc())
        .limit(limit)
        .all()
    )


@router.post("/run-scraper/{store_slug}")
def trigger_scraper(store_slug: str):
    from app.tasks.scrape_tasks import run_scraper  # lazy import avoids circular deps
    run_scraper.delay(store_slug)
    return {"status": "queued", "store": store_slug}
