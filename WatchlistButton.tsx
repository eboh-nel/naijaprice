"""Tests for the product matching service."""
import pytest
from app.models import Product, ProductVariant, Listing, Category, MatchReviewQueue, MatchReviewStatus
from app.services.matching import match_and_save, _create_new_product_variant, _unique_slug


def make_listing(db, store, title="Samsung Galaxy A15 128GB"):
    listing = Listing(
        store_id=store.id,
        title=title,
        product_url=f"https://teststore.ng/product/{hash(title)}",
        is_active=True,
    )
    db.add(listing)
    db.flush()
    return listing


class TestUniqueSlug:
    def test_returns_base_slug_when_free(self, db):
        slug = _unique_slug(db, "samsung-galaxy-a15")
        assert slug == "samsung-galaxy-a15"

    def test_increments_when_taken(self, db, seed_category):
        product = Product(
            brand="Samsung", model="Galaxy A15",
            normalized_name="samsung galaxy a15",
            slug="collision-test",
            category_id=seed_category.id,
        )
        db.add(product)
        db.flush()

        slug = _unique_slug(db, "collision-test")
        assert slug == "collision-test-1"

    def test_increments_twice(self, db, seed_category):
        for i in range(2):
            p = Product(
                brand="X", model=f"Y{i}",
                normalized_name=f"x y{i}",
                slug="double-test" if i == 0 else "double-test-1",
                category_id=seed_category.id,
            )
            db.add(p)
        db.flush()

        slug = _unique_slug(db, "double-test")
        assert slug == "double-test-2"


class TestCreateNewProductVariant:
    def test_creates_product_and_variant(self, db, seed_category):
        # Need uncategorized category for the service
        from app.models import Category
        uncat = Category(name="Uncategorized", slug="uncategorized")
        db.add(uncat)
        db.flush()

        normalized = {
            "brand": "Tecno",
            "model": "Spark 10",
            "storage": "128GB",
            "ram": "8GB",
            "color": "Blue",
            "variant_key": "TECNO|SPARK 10|128GB|8GB",
        }
        variant = _create_new_product_variant(db, normalized)
        assert variant is not None
        assert variant.storage == "128GB"
        assert variant.variant_key == "TECNO|SPARK 10|128GB|8GB"

        product = db.query(Product).filter(Product.brand == "Tecno").first()
        assert product is not None
        assert product.model == "Spark 10"

    def test_reuses_existing_product_for_new_variant(self, db, seed_category):
        from app.models import Category
        uncat = db.query(Category).filter(Category.slug == "uncategorized").first()
        if not uncat:
            uncat = Category(name="Uncategorized", slug="uncategorized")
            db.add(uncat)
            db.flush()

        normalized1 = {
            "brand": "Infinix",
            "model": "Note 30",
            "storage": "128GB",
            "ram": "8GB",
            "variant_key": "INFINIX|NOTE 30|128GB|8GB",
        }
        normalized2 = {
            "brand": "Infinix",
            "model": "Note 30",
            "storage": "256GB",
            "ram": "8GB",
            "variant_key": "INFINIX|NOTE 30|256GB|8GB",
        }
        v1 = _create_new_product_variant(db, normalized1)
        v2 = _create_new_product_variant(db, normalized2)

        assert v1.product_id == v2.product_id

    def test_returns_none_when_no_brand(self, db):
        normalized = {"model": "Unknown", "variant_key": None}
        result = _create_new_product_variant(db, normalized)
        assert result is None


class TestMatchAndSave:
    def test_exact_key_match_links_listing(self, db, seed_store, seed_variant):
        listing = make_listing(db, seed_store)
        raw = {
            "title": "Samsung Galaxy A15 128GB 4GB RAM Black",
            "brand": "Samsung",
            "model": "Galaxy A15",
            "storage": "128GB",
            "ram": "4GB",
            "variant_key": seed_variant.variant_key,
            "price": 289900,
        }
        match_and_save(db, raw, seed_store.id, listing)
        assert listing.product_variant_id == seed_variant.id

    def test_no_variant_key_goes_to_review(self, db, seed_store):
        listing = make_listing(db, seed_store, title="Unknown Unbranded Gadget XYZ")
        raw = {
            "title": "Unknown Unbranded Gadget XYZ",
            "brand": None,
            "model": None,
            "variant_key": None,
            "price": 5000,
        }
        match_and_save(db, raw, seed_store.id, listing)

        queued = db.query(MatchReviewQueue).filter(
            MatchReviewQueue.listing_id == listing.id
        ).first()
        assert queued is not None
        assert queued.status == MatchReviewStatus.pending

    def test_new_product_created_when_no_match(self, db, seed_store, seed_category):
        from app.models import Category
        uncat = db.query(Category).filter(Category.slug == "uncategorized").first()
        if not uncat:
            uncat = Category(name="Uncategorized", slug="uncategorized")
            db.add(uncat)
            db.flush()

        listing = make_listing(db, seed_store, title="Oppo Reno 11 256GB 12GB RAM Silver")
        raw = {
            "title": "Oppo Reno 11 256GB 12GB RAM Silver",
            "brand": "Oppo",
            "model": "Reno 11",
            "storage": "256GB",
            "ram": "12GB",
            "color": "Silver",
            "variant_key": "OPPO|RENO 11|256GB|12GB",
            "price": 450000,
        }
        match_and_save(db, raw, seed_store.id, listing)

        new_product = db.query(Product).filter(
            Product.brand == "Oppo", Product.model == "Reno 11"
        ).first()
        assert new_product is not None
        assert listing.product_variant_id is not None
