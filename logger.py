from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models import StockStatus


class StoreOut(BaseModel):
    id: int
    name: str
    slug: str
    base_url: str
    logo_url: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class PriceOut(BaseModel):
    price: float
    old_price: Optional[float]
    currency: str
    scraped_at: datetime

    class Config:
        from_attributes = True


class ListingOut(BaseModel):
    id: int
    title: str
    product_url: str
    image_url: Optional[str]
    seller_name: Optional[str]
    stock_status: StockStatus
    last_seen_at: Optional[datetime]
    store: StoreOut
    latest_price: Optional[PriceOut]

    class Config:
        from_attributes = True


class VariantOut(BaseModel):
    id: int
    color: Optional[str]
    storage: Optional[str]
    ram: Optional[str]
    size: Optional[str]
    variant_key: str

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    brand: str
    model: str
    normalized_name: str
    slug: str
    category_id: int

    class Config:
        from_attributes = True


class ComparisonEntry(BaseModel):
    store: str
    store_logo: Optional[str]
    price: float
    old_price: Optional[float]
    currency: str
    stock_status: StockStatus
    seller_name: Optional[str]
    product_url: str
    last_updated: Optional[datetime]
    discount_pct: Optional[float]


class SearchResult(BaseModel):
    product_id: int
    variant_id: int
    product_name: str
    variant_label: str
    slug: str
    image_url: Optional[str]
    lowest_price: float
    currency: str
    store_count: int
    stores: List[ComparisonEntry]
    last_updated: Optional[datetime]


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResult]


class PriceHistoryPoint(BaseModel):
    store: str
    price: float
    scraped_at: datetime


class ProductDetailOut(BaseModel):
    product: ProductOut
    variant: VariantOut
    comparison: List[ComparisonEntry]
    price_history: List[PriceHistoryPoint]


# ── Alerts & Watchlist ──────────────────────────────────────────────────────

class PriceAlertCreate(BaseModel):
    product_variant_id: int
    email: str
    target_price: float


class PriceAlertOut(BaseModel):
    id: int
    product_variant_id: int
    email: str
    target_price: float
    is_active: bool
    triggered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class WatchlistCreate(BaseModel):
    product_variant_id: int
    email: str


class WatchlistOut(BaseModel):
    id: int
    product_variant_id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True
