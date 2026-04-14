"""Tests for API endpoints."""
import pytest
from app.models import Store, Category, Product, ProductVariant


class TestHealthEndpoint:
    def test_health(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


class TestStoresEndpoint:
    def test_list_stores_empty(self, client):
        res = client.get("/api/stores")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_stores_with_data(self, client, db):
        store = Store(name="Jumia NG", slug="jumia-ng", base_url="https://jumia.com.ng", is_active=True)
        db.add(store)
        db.flush()

        res = client.get("/api/stores")
        assert res.status_code == 200
        slugs = [s["slug"] for s in res.json()]
        assert "jumia-ng" in slugs

    def test_get_store_by_slug(self, client, db):
        store = Store(name="Konga NG", slug="konga-ng", base_url="https://konga.com", is_active=True)
        db.add(store)
        db.flush()

        res = client.get("/api/stores/konga-ng")
        assert res.status_code == 200
        assert res.json()["name"] == "Konga NG"

    def test_get_store_404(self, client):
        res = client.get("/api/stores/nonexistent-store")
        assert res.status_code == 404


class TestCategoriesEndpoint:
    def test_list_categories_empty(self, client):
        res = client.get("/api/categories")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_categories_with_data(self, client, db):
        cat = Category(name="Laptops Test", slug="laptops-test")
        db.add(cat)
        db.flush()

        res = client.get("/api/categories")
        assert res.status_code == 200
        slugs = [c["slug"] for c in res.json()]
        assert "laptops-test" in slugs


class TestSearchEndpoint:
    def test_search_requires_query(self, client):
        res = client.get("/api/search")
        assert res.status_code == 422  # missing required param

    def test_search_short_query_rejected(self, client):
        res = client.get("/api/search?q=a")
        assert res.status_code == 422

    def test_search_returns_structure(self, client):
        res = client.get("/api/search?q=samsung")
        assert res.status_code == 200
        data = res.json()
        assert "query" in data
        assert "total" in data
        assert "results" in data
        assert isinstance(data["results"], list)

    def test_search_empty_results(self, client):
        res = client.get("/api/search?q=xyzproductnotfound123")
        assert res.status_code == 200
        assert res.json()["total"] == 0


class TestProductsEndpoint:
    def test_product_not_found(self, client):
        res = client.get("/api/products/nonexistent-slug")
        assert res.status_code == 404

    def test_product_variants_not_found(self, client):
        res = client.get("/api/products/nonexistent-slug/variants")
        assert res.status_code == 404

    def test_product_variants_empty(self, client, db, seed_category):
        product = Product(
            brand="Test",
            model="Phone X",
            normalized_name="test phone x",
            slug="test-phone-x",
            category_id=seed_category.id,
        )
        db.add(product)
        db.flush()

        res = client.get("/api/products/test-phone-x/variants")
        assert res.status_code == 200
        assert res.json() == []


class TestAlertsEndpoint:
    def test_create_alert(self, client, db, seed_category):
        product = Product(
            brand="Alert", model="Test", normalized_name="alert test",
            slug="alert-test-product", category_id=seed_category.id,
        )
        db.add(product)
        db.flush()

        variant = ProductVariant(
            product_id=product.id,
            variant_key="ALERT|TEST|64GB",
            storage="64GB",
        )
        db.add(variant)
        db.flush()

        res = client.post("/api/user/alerts", json={
            "product_variant_id": variant.id,
            "email": "test@example.com",
            "target_price": 50000.0,
        })
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "test@example.com"
        assert data["target_price"] == 50000.0
        assert data["is_active"] is True

    def test_list_alerts(self, client):
        res = client.get("/api/user/alerts/nobody@example.com")
        assert res.status_code == 200
        assert res.json() == []

    def test_create_alert_missing_variant(self, client):
        res = client.post("/api/user/alerts", json={
            "product_variant_id": 999999,
            "email": "test@example.com",
            "target_price": 10000.0,
        })
        assert res.status_code == 404
