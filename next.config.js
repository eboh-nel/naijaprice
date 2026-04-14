"""
End-to-end tests for the search service.
Seeds real Product → Variant → Listing → Price chain and verifies
that search_products returns correct, sorted results.
"""
import pytest
from datetime import datetime
from app.models import Product, ProductVariant, Listing, Price, Store, Category
from app.services.search_service import search_products


@pytest.fixture()
def full_product_chain(db):
    """
    Creates:
        Samsung Galaxy A15  (phones category)
          └── variant: 128GB / 4GB / Black
                ├── listing on Jumia  @ ₦289,900
                └── listing on Konga  @ ₦295,000
    """
    cat = Category(name="Phones", slug="phones-search-test")
    db.add(cat)
    db.flush()

    product = Product(
        brand="Samsung",
        model="Galaxy A15",
        normalized_name="samsung galaxy a15",
        slug="samsung-galaxy-a15-search-test",
        category_id=cat.id,
    )
    db.add(product)
    db.flush()

    variant = ProductVariant(
        product_id=product.id,
        storage="128GB",
        ram="4GB",
        color="Black",
        variant_key="SAMSUNG|GALAXY A15|128GB|4GB|SEARCH-TEST",
    )
    db.add(variant)
    db.flush()

    jumia = Store(name="Jumia", slug="jumia-search-test", base_url="https://jumia.com.ng", is_active=True)
    konga = Store(name="Konga", slug="konga-search-test", base_url="https://konga.com", is_active=True)
    db.add_all([jumia, konga])
    db.flush()

    listing_j = Listing(
        store_id=jumia.id,
        product_variant_id=variant.id,
        title="Samsung Galaxy A15 128GB 4GB RAM Black",
        product_url="https://jumia.com.ng/samsung-a15",
        image_url="https://ng.jumia.is/samsung-a15.jpg",
        stock_status="in_stock",
        is_active=True,
        last_seen_at=datetime.utcnow(),
    )
    listing_k = Listing(
        store_id=konga.id,
        product_variant_id=variant.id,
        title="Samsung Galaxy A15 4GB 128GB",
        product_url="https://konga.com/samsung-a15",
        stock_status="in_stock",
        is_active=True,
        last_seen_at=datetime.utcnow(),
    )
    db.add_all([listing_j, listing_k])
    db.flush()

    price_j = Price(listing_id=listing_j.id, price=289900, old_price=320000, currency="NGN")
    price_k = Price(listing_id=listing_k.id, price=295000, currency="NGN")
    db.add_all([price_j, price_k])
    db.flush()

    return {
        "product": product, "variant": variant,
        "jumia": jumia, "konga": konga,
        "listing_j": listing_j, "listing_k": listing_k,
        "price_j": price_j, "price_k": price_k,
    }


class TestSearchProducts:
    def test_finds_product_by_brand(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        slugs = [r.slug for r in results]
        assert "samsung-galaxy-a15-search-test" in slugs

    def test_finds_product_by_model(self, db, full_product_chain):
        results = search_products(db, "Galaxy A15")
        assert len(results) >= 1
        assert results[0].product_name == "Samsung Galaxy A15"

    def test_no_results_for_garbage_query(self, db, full_product_chain):
        results = search_products(db, "xyznotaproduct999")
        assert results == []

    def test_lowest_price_is_correct(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        assert result.lowest_price == 289900.0

    def test_stores_sorted_cheapest_first(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        prices = [s.price for s in result.stores]
        assert prices == sorted(prices)

    def test_store_count_correct(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        assert result.store_count == 2

    def test_variant_label_built_correctly(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        assert "128GB" in result.variant_label
        assert "RAM" in result.variant_label

    def test_image_url_populated(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        assert result.image_url is not None

    def test_category_filter_works(self, db, full_product_chain):
        results_match = search_products(db, "Samsung", category="phones-search-test")
        results_miss  = search_products(db, "Samsung", category="laptops")
        assert len(results_match) >= 1
        assert len(results_miss) == 0

    def test_price_filter_min(self, db, full_product_chain):
        # Only Konga (295k) passes; Jumia (289.9k) is filtered
        results = search_products(db, "Samsung", min_price=290000)
        result = next((r for r in results if r.slug == "samsung-galaxy-a15-search-test"), None)
        if result:
            for entry in result.stores:
                assert entry.price >= 290000

    def test_price_filter_max(self, db, full_product_chain):
        results = search_products(db, "Samsung", max_price=290000)
        result = next((r for r in results if r.slug == "samsung-galaxy-a15-search-test"), None)
        if result:
            for entry in result.stores:
                assert entry.price <= 290000

    def test_store_filter(self, db, full_product_chain):
        results = search_products(db, "Samsung", store="jumia-search-test")
        result = next((r for r in results if r.slug == "samsung-galaxy-a15-search-test"), None)
        if result:
            assert all(s.store == "Jumia" for s in result.stores)

    def test_discount_pct_calculated(self, db, full_product_chain):
        results = search_products(db, "Samsung")
        result = next(r for r in results if r.slug == "samsung-galaxy-a15-search-test")
        jumia_entry = next(s for s in result.stores if s.store == "Jumia")
        # 289900 / 320000 = ~9.4% off
        assert jumia_entry.discount_pct is not None
        assert 8 < jumia_entry.discount_pct < 12

    def test_inactive_listings_excluded(self, db, full_product_chain):
        listing_j = full_product_chain["listing_j"]
        listing_j.is_active = False
        db.flush()

        results = search_products(db, "Samsung")
        result = next((r for r in results if r.slug == "samsung-galaxy-a15-search-test"), None)
        if result:
            assert all(s.store != "Jumia" for s in result.stores)
