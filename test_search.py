from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PriceAlert, Watchlist, ProductVariant
from app.schemas import PriceAlertCreate, PriceAlertOut, WatchlistCreate, WatchlistOut

router = APIRouter()


# ── Price Alerts ─────────────────────────────────────────────────────────────

@router.post("/alerts", response_model=PriceAlertOut, status_code=201)
def create_alert(payload: PriceAlertCreate, db: Session = Depends(get_db)):
    variant = db.get(ProductVariant, payload.product_variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")

    # Avoid duplicates
    existing = db.query(PriceAlert).filter(
        PriceAlert.product_variant_id == payload.product_variant_id,
        PriceAlert.email == payload.email,
        PriceAlert.is_active == True,
    ).first()
    if existing:
        existing.target_price = payload.target_price
        db.commit()
        db.refresh(existing)
        return existing

    alert = PriceAlert(
        product_variant_id=payload.product_variant_id,
        email=payload.email,
        target_price=payload.target_price,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/alerts/{email}", response_model=list[PriceAlertOut])
def list_alerts(email: str, db: Session = Depends(get_db)):
    return (
        db.query(PriceAlert)
        .filter(PriceAlert.email == email, PriceAlert.is_active == True)
        .all()
    )


@router.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(PriceAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    db.commit()


# ── Watchlist ────────────────────────────────────────────────────────────────

@router.post("/watchlist", response_model=WatchlistOut, status_code=201)
def add_to_watchlist(payload: WatchlistCreate, db: Session = Depends(get_db)):
    variant = db.get(ProductVariant, payload.product_variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")

    existing = db.query(Watchlist).filter(
        Watchlist.product_variant_id == payload.product_variant_id,
        Watchlist.email == payload.email,
    ).first()
    if existing:
        return existing

    item = Watchlist(
        product_variant_id=payload.product_variant_id,
        email=payload.email,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/watchlist/{email}", response_model=list[WatchlistOut])
def get_watchlist(email: str, db: Session = Depends(get_db)):
    return db.query(Watchlist).filter(Watchlist.email == email).all()


@router.delete("/watchlist/{item_id}", status_code=204)
def remove_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Watchlist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(item)
    db.commit()
