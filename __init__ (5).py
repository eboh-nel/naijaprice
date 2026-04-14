"""init

Revision ID: 0001
Revises:
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "stores",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("base_url", sa.String(255), nullable=False),
        sa.Column("logo_url", sa.String(500)),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("categories.id")),
        sa.Column("brand", sa.String(100), index=True),
        sa.Column("model", sa.String(200), index=True),
        sa.Column("normalized_name", sa.String(500), index=True),
        sa.Column("slug", sa.String(500), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id")),
        sa.Column("color", sa.String(50)),
        sa.Column("storage", sa.String(20)),
        sa.Column("ram", sa.String(20)),
        sa.Column("size", sa.String(20)),
        sa.Column("sku", sa.String(100)),
        sa.Column("variant_key", sa.String(300), index=True, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    stock_status_enum = sa.Enum(
        "in_stock", "out_of_stock", "limited", "unknown",
        name="stockstatus"
    )
    op.create_table(
        "listings",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("store_id", sa.Integer, sa.ForeignKey("stores.id")),
        sa.Column("product_variant_id", sa.Integer, sa.ForeignKey("product_variants.id"), nullable=True),
        sa.Column("store_product_id", sa.String(200)),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("product_url", sa.Text, nullable=False),
        sa.Column("image_url", sa.Text),
        sa.Column("seller_name", sa.String(200)),
        sa.Column("stock_status", stock_status_enum, default="unknown"),
        sa.Column("last_seen_at", sa.DateTime(timezone=True)),
        sa.Column("is_active", sa.Boolean, default=True),
    )

    op.create_table(
        "prices",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("listing_id", sa.Integer, sa.ForeignKey("listings.id")),
        sa.Column("price", sa.Float, nullable=False),
        sa.Column("old_price", sa.Float),
        sa.Column("currency", sa.String(10), default="NGN"),
        sa.Column("scraped_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    scrape_status_enum = sa.Enum(
        "pending", "running", "completed", "failed",
        name="scrapejobstatus"
    )
    op.create_table(
        "scrape_jobs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("store_id", sa.Integer, sa.ForeignKey("stores.id")),
        sa.Column("status", scrape_status_enum, default="pending"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column("pages_scraped", sa.Integer, default=0),
        sa.Column("errors_count", sa.Integer, default=0),
    )

    review_status_enum = sa.Enum(
        "pending", "approved", "rejected",
        name="matchreviewstatus"
    )
    op.create_table(
        "match_review_queue",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("listing_id", sa.Integer, sa.ForeignKey("listings.id")),
        sa.Column("suggested_variant_id", sa.Integer, sa.ForeignKey("product_variants.id"), nullable=True),
        sa.Column("confidence_score", sa.Float, default=0.0),
        sa.Column("status", review_status_enum, default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    alert_channel_enum = sa.Enum("email", "whatsapp", name="alertchannel")
    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("product_variant_id", sa.Integer, sa.ForeignKey("product_variants.id"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("target_price", sa.Float, nullable=False),
        sa.Column("channel", alert_channel_enum, default="email"),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "watchlist",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("product_variant_id", sa.Integer, sa.ForeignKey("product_variants.id"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("watchlist")
    op.drop_table("price_alerts")
    op.drop_table("match_review_queue")
    op.drop_table("scrape_jobs")
    op.drop_table("prices")
    op.drop_table("listings")
    op.drop_table("product_variants")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_table("stores")

    for enum_name in [
        "stockstatus", "scrapejobstatus", "matchreviewstatus", "alertchannel"
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
