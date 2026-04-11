from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, ProductVariant, Listing, Price, Store
from app.schemas import ProductDetailOut, ComparisonEntry, PriceHistoryPoint, ProductOut, VariantOut
from sqlalchemy import desc

router = APIRouter()


@router.get("/{slug}", response_model=ProductDetailOut)
def get_product(slug: str, variant_id: int | None = None, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get first variant if none specified
    variant = None
    if variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product.id,
        ).first()
    if not variant:
        variant = db.query(ProductVariant).filter(
            ProductVariant.product_id == product.id
        ).first()

    if not variant:
        raise HTTPException(status_code=404, detail="No variants found")

    # Build comparison table
    listings = (
        db.query(Listing)
        .filter(Listing.product_variant_id == variant.id, Listing.is_active == True)
        .all()
    )

    comparison = []
    for listing in listings:
        latest_price = (
            db.query(Price)
            .filter(Price.listing_id == listing.id)
            .order_by(desc(Price.scraped_at))
            .first()
        )
        if not latest_price:
            continue
        store = listing.store
        discount = None
        if latest_price.old_price and latest_price.old_price > latest_price.price:
            discount = round((1 - latest_price.price / latest_price.old_price) * 100, 1)

        comparison.append(
            ComparisonEntry(
                store=store.name,
                store_logo=store.logo_url,
                price=latest_price.price,
                old_price=latest_price.old_price,
                currency=latest_price.currency,
                stock_status=listing.stock_status,
                seller_name=listing.seller_name,
                product_url=listing.product_url,
                last_updated=listing.last_seen_at,
                discount_pct=discount,
            )
        )
    comparison.sort(key=lambda x: x.price)

    # Build price history (last 90 days, all stores)
    history = []
    for listing in listings:
        store = listing.store
        prices = (
            db.query(Price)
            .filter(Price.listing_id == listing.id)
            .order_by(Price.scraped_at)
            .limit(90)
            .all()
        )
        for p in prices:
            history.append(
                PriceHistoryPoint(store=store.name, price=p.price, scraped_at=p.scraped_at)
            )
    history.sort(key=lambda x: x.scraped_at)

    return ProductDetailOut(
        product=ProductOut.model_validate(product),
        variant=VariantOut.model_validate(variant),
        comparison=comparison,
        price_history=history,
    )
