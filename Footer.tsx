"""
Price drop detection service.

Called after each scrape cycle to:
1. Find all active alerts whose target price has been hit.
2. Send email notifications.
3. Mark alerts as triggered.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import PriceAlert, ProductVariant, Listing, Price, Product
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def check_and_notify(db: Session):
    """
    Scan all active price alerts. For each one, check if any listing
    for that variant is currently at or below the target price.
    If so, send an email and deactivate the alert.
    """
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.is_active == True)
        .all()
    )

    triggered = 0
    for alert in alerts:
        current_low = _get_current_lowest(db, alert.product_variant_id)
        if current_low is None:
            continue
        if current_low <= alert.target_price:
            _send_alert_email(db, alert, current_low)
            alert.is_active = False
            alert.triggered_at = datetime.utcnow()
            triggered += 1

    db.commit()
    logger.info(f"Price alert check done. {triggered} alerts triggered.")
    return triggered


def _get_current_lowest(db: Session, variant_id: int) -> float | None:
    listings = (
        db.query(Listing)
        .filter(
            Listing.product_variant_id == variant_id,
            Listing.is_active == True,
        )
        .all()
    )
    prices = []
    for listing in listings:
        latest = (
            db.query(Price)
            .filter(Price.listing_id == listing.id)
            .order_by(desc(Price.scraped_at))
            .first()
        )
        if latest:
            prices.append(latest.price)
    return min(prices) if prices else None


def _send_alert_email(db: Session, alert: PriceAlert, current_price: float):
    variant = db.get(ProductVariant, alert.product_variant_id)
    if not variant:
        return

    product = db.get(Product, variant.product_id)
    product_name = f"{product.brand} {product.model}" if product else "Product"
    variant_parts = [variant.storage, variant.ram, variant.color]
    variant_label = " / ".join(p for p in variant_parts if p) or "Standard"

    subject = f"🔔 Price Drop: {product_name} is now ₦{current_price:,.0f}"
    body = f"""
Hi there,

Good news! A product you're watching has dropped to your target price.

Product:  {product_name}
Variant:  {variant_label}
Your target: ₦{alert.target_price:,.0f}
Current price: ₦{current_price:,.0f}

Search it now at:
https://naijaprice.ng/product/{product.slug if product else ""}

Happy shopping!
— NaijaPrice
"""

    if not _email_configured():
        logger.info(f"[Mock email] To: {alert.email} | {subject}")
        logger.info(body)
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM
        msg["To"] = alert.email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_FROM, alert.email, msg.as_string())

        logger.info(f"Alert email sent to {alert.email} for variant {alert.product_variant_id}")
    except Exception as e:
        logger.error(f"Failed to send alert email to {alert.email}: {e}")


def _email_configured() -> bool:
    return bool(
        getattr(settings, "SMTP_HOST", None)
        and getattr(settings, "SMTP_USER", None)
    )
