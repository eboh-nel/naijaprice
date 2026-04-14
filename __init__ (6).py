from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class StockStatus(str, enum.Enum):
    in_stock = "in_stock"
    out_of_stock = "out_of_stock"
    limited = "limited"
    unknown = "unknown"


class ScrapeJobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class MatchReviewStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    base_url = Column(String(255), nullable=False)
    logo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    listings = relationship("Listing", back_populates="store")
    scrape_jobs = relationship("ScrapeJob", back_populates="store")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand = Column(String(100), index=True)
    model = Column(String(200), index=True)
    normalized_name = Column(String(500), index=True)
    slug = Column(String(500), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product")


class ProductVariant(Base):
    __tablename__ = "product_variants"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    color = Column(String(50))
    storage = Column(String(20))
    ram = Column(String(20))
    size = Column(String(20))
    sku = Column(String(100))
    variant_key = Column(String(300), index=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", back_populates="variants")
    listings = relationship("Listing", back_populates="variant")


class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    product_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    store_product_id = Column(String(200))
    title = Column(Text, nullable=False)
    product_url = Column(Text, nullable=False)
    image_url = Column(Text)
    seller_name = Column(String(200))
    stock_status = Column(SAEnum(StockStatus, native_enum=False), default=StockStatus.unknown)
    last_seen_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    store = relationship("Store", back_populates="listings")
    variant = relationship("ProductVariant", back_populates="listings")
    prices = relationship("Price", back_populates="listing", order_by="Price.scraped_at.desc()")


class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    price = Column(Float, nullable=False)
    old_price = Column(Float)
    currency = Column(String(10), default="NGN")
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    listing = relationship("Listing", back_populates="prices")


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"))
    status = Column(SAEnum(ScrapeJobStatus, native_enum=False), default=ScrapeJobStatus.pending)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    pages_scraped = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    store = relationship("Store", back_populates="scrape_jobs")


class MatchReviewQueue(Base):
    __tablename__ = "match_review_queue"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    suggested_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    confidence_score = Column(Float, default=0.0)
    status = Column(SAEnum(MatchReviewStatus, native_enum=False), default=MatchReviewStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AlertChannel(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"


class PriceAlert(Base):
    """User sets a target price for a product variant; system emails them when hit."""
    __tablename__ = "price_alerts"
    id = Column(Integer, primary_key=True, index=True)
    product_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    channel = Column(SAEnum(AlertChannel, native_enum=False), default=AlertChannel.email)
    is_active = Column(Boolean, default=True)
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    variant = relationship("ProductVariant")


class Watchlist(Base):
    """User saves a product variant to watch — no threshold, just tracking."""
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    product_variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    variant = relationship("ProductVariant")
