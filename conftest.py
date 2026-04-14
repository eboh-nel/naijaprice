from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Store, Listing, Price, ProductVariant, Product
from app.schemas import StoreOut

router = APIRouter()


@router.get("", response_model=list[StoreOut])
def list_stores(db: Session = Depends(get_db)):
    return db.query(Store).filter(Store.is_active == True).all()


@router.get("/{slug}", response_model=StoreOut)
def get_store(slug: str, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.get("/{slug}/products")
def get_store_products(
    slug: str,
    limit: int = Query(40, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Return current listings for a specific store with latest prices."""
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    listings = (
        db.query(Listing)
        .filter(Listing.store_id == store.id, Listing.is_active == True)
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for listing in listings:
        latest_price = (
            db.query(Price)
            .filter(Price.listing_id == listing.id)
            .order_by(desc(Price.scraped_at))
            .first()
        )
        variant = (
            db.get(ProductVariant, listing.product_variant_id)
            if listing.product_variant_id else None
        )
        product = db.get(Product, variant.product_id) if variant else None

        results.append({
            "listing_id": listing.id,
            "title": listing.title,
            "product_url": listing.product_url,
            "image_url": listing.image_url,
            "seller_name": listing.seller_name,
            "stock_status": listing.stock_status,
            "last_seen_at": listing.last_seen_at,
            "price": latest_price.price if latest_price else None,
            "old_price": latest_price.old_price if latest_price else None,
            "currency": latest_price.currency if latest_price else "NGN",
            "product_slug": product.slug if product else None,
            "variant_id": variant.id if variant else None,
        })

    return {
        "store": slug,
        "total": len(results),
        "offset": offset,
        "limit": limit,
        "products": results,
    }

