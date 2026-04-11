from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Product, ProductVariant, Listing, Price, Store
from app.schemas import SearchResult, ComparisonEntry


def search_products(
    db: Session,
    query: str,
    category: str | None = None,
    store: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: int = 20,
) -> list[SearchResult]:
    # Full text search on products
    q = (
        db.query(Product)
        .filter(
            func.to_tsvector("english", Product.normalized_name).op("@@")(
                func.plainto_tsquery("english", query)
            )
        )
    )

    if category:
        from app.models import Category
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            q = q.filter(Product.category_id == cat.id)

    products = q.limit(limit).all()
    results = []

    for product in products:
        variants = db.query(ProductVariant).filter(
            ProductVariant.product_id == product.id
        ).all()

        for variant in variants:
            listings = (
                db.query(Listing)
                .filter(
                    Listing.product_variant_id == variant.id,
                    Listing.is_active == True,
                )
                .all()
            )
            if not listings:
                continue

            store_entries = []
            image_url = None

            for listing in listings:
                if store and listing.store.slug != store:
                    continue

                latest_price = (
                    db.query(Price)
                    .filter(Price.listing_id == listing.id)
                    .order_by(desc(Price.scraped_at))
                    .first()
                )
                if not latest_price:
                    continue
                if min_price and latest_price.price < min_price:
                    continue
                if max_price and latest_price.price > max_price:
                    continue

                if not image_url:
                    image_url = listing.image_url

                discount = None
                if latest_price.old_price and latest_price.old_price > latest_price.price:
                    discount = round((1 - latest_price.price / latest_price.old_price) * 100, 1)

                store_entries.append(
                    ComparisonEntry(
                        store=listing.store.name,
                        store_logo=listing.store.logo_url,
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

            if not store_entries:
                continue

            store_entries.sort(key=lambda x: x.price)
            lowest = store_entries[0].price
            last_updated = max(
                (e.last_updated for e in store_entries if e.last_updated),
                default=None,
            )

            label_parts = []
            if variant.storage:
                label_parts.append(variant.storage)
            if variant.ram:
                label_parts.append(f"{variant.ram} RAM")
            if variant.color:
                label_parts.append(variant.color)
            variant_label = " / ".join(label_parts) or "Standard"

            results.append(
                SearchResult(
                    product_id=product.id,
                    variant_id=variant.id,
                    product_name=f"{product.brand} {product.model}",
                    variant_label=variant_label,
                    slug=product.slug,
                    image_url=image_url,
                    lowest_price=lowest,
                    currency="NGN",
                    store_count=len(store_entries),
                    stores=store_entries,
                    last_updated=last_updated,
                )
            )

    return results
