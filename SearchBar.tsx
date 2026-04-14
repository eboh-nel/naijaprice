"""Tests for text utility functions."""
import pytest
from app.utils.text import (
    normalize_text,
    extract_brand,
    extract_storage,
    extract_ram,
    extract_color,
    build_variant_key,
    clean_price,
)


class TestNormalizeText:
    def test_lowercases(self):
        assert normalize_text("Samsung Galaxy A15") == "samsung galaxy a15"

    def test_strips_promo_words(self):
        result = normalize_text("Samsung Galaxy A15 - Free Delivery")
        assert "free delivery" not in result

    def test_collapses_whitespace(self):
        result = normalize_text("Samsung   Galaxy    A15")
        assert "  " not in result

    def test_handles_empty(self):
        assert normalize_text("") == ""


class TestExtractBrand:
    def test_samsung(self):
        assert extract_brand("Samsung Galaxy A15 128GB") == "Samsung"

    def test_apple(self):
        assert extract_brand("Apple iPhone 13 Pro") == "Apple"

    def test_tecno(self):
        assert extract_brand("Tecno Spark 10 Pro") == "Tecno"

    def test_unknown_brand(self):
        assert extract_brand("Random XYZ Phone") is None

    def test_case_insensitive(self):
        assert extract_brand("SAMSUNG GALAXY") == "Samsung"


class TestExtractStorage:
    def test_basic(self):
        assert extract_storage("Samsung Galaxy A15 128GB") == "128GB"

    def test_no_storage(self):
        assert extract_storage("Samsung Galaxy A15") is None

    def test_doesnt_match_ram(self):
        # "4GB RAM" should not be treated as storage
        result = extract_storage("Phone 4GB RAM 64GB")
        assert result == "64GB"

    def test_256gb(self):
        assert extract_storage("iPhone 13 256GB Space Grey") == "256GB"


class TestExtractRam:
    def test_with_ram_suffix(self):
        assert extract_ram("Samsung A15 4GB RAM") == "4GB"

    def test_no_ram(self):
        assert extract_ram("Samsung Galaxy A15 128GB") is None

    def test_8gb_ram(self):
        assert extract_ram("Tecno Spark 8GB RAM 256GB") == "8GB"


class TestExtractColor:
    def test_black(self):
        assert extract_color("Samsung Galaxy A15 Black") == "Black"

    def test_midnight(self):
        assert extract_color("iPhone 13 Midnight") == "Midnight"

    def test_no_color(self):
        assert extract_color("Samsung Galaxy A15 128GB") is None


class TestBuildVariantKey:
    def test_basic(self):
        key = build_variant_key("Samsung", "Galaxy A15", "128GB", "4GB")
        assert key == "SAMSUNG|GALAXY A15|128GB|4GB"

    def test_without_ram(self):
        key = build_variant_key("Samsung", "Galaxy A15", "128GB")
        assert key == "SAMSUNG|GALAXY A15|128GB"

    def test_without_storage(self):
        key = build_variant_key("Apple", "iPhone 13")
        assert key == "APPLE|IPHONE 13"


class TestCleanPrice:
    def test_naira_symbol(self):
        assert clean_price("₦289,900") == 289900.0

    def test_comma_separated(self):
        assert clean_price("1,200,000") == 1200000.0

    def test_decimal(self):
        assert clean_price("₦15,999.99") == 15999.99

    def test_plain_number(self):
        assert clean_price("50000") == 50000.0

    def test_invalid(self):
        assert clean_price("out of stock") is None

    def test_empty(self):
        assert clean_price("") is None
