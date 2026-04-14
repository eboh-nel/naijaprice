"""Tests for product normalization service."""
import pytest
from app.services.normalization import normalize_product


class TestNormalizeProduct:
    def test_extracts_brand_and_model(self):
        raw = {
            "title": "Samsung Galaxy A15 Dual SIM 128GB 4GB RAM - Black",
            "price": 289900,
        }
        result = normalize_product(raw)
        assert result["brand"] == "Samsung"
        assert result["storage"] == "128GB"
        assert result["ram"] == "4GB"
        assert result["color"] == "Black"

    def test_builds_variant_key(self):
        raw = {
            "title": "Samsung Galaxy A15 128GB 4GB RAM",
            "price": 289900,
        }
        result = normalize_product(raw)
        assert result["variant_key"] is not None
        assert "SAMSUNG" in result["variant_key"]

    def test_passes_through_extra_fields(self):
        raw = {
            "title": "Test Phone",
            "price": 50000,
            "product_url": "https://example.com/phone",
            "store": "TestStore",
        }
        result = normalize_product(raw)
        assert result["product_url"] == "https://example.com/phone"
        assert result["store"] == "TestStore"

    def test_no_variant_key_when_no_brand(self):
        raw = {"title": "Unknown Generic XYZ-990", "price": 10000}
        result = normalize_product(raw)
        assert result["variant_key"] is None

    def test_uses_provided_brand(self):
        raw = {
            "title": "A15 128GB Black",
            "brand": "Samsung",
            "model": "Galaxy A15",
            "price": 289900,
        }
        result = normalize_product(raw)
        assert result["brand"] == "Samsung"
        assert result["model"] == "Galaxy A15"
