"""
Run once after migrations to seed initial stores and categories.
Usage: python seed.py
"""
from app.database import SessionLocal
from app.models import Store, Category

STORES = [
    {"name": "Jumia", "slug": "jumia", "base_url": "https://www.jumia.com.ng", "logo_url": "https://www.jumia.com.ng/assets/favicons/favicon-32x32.png"},
    {"name": "Konga", "slug": "konga", "base_url": "https://www.konga.com", "logo_url": "https://www-konga-com-res.cloudinary.com/image/upload/w_auto,f_auto,fl_lossy,dpr_auto,q_auto/media/general/konga_logo.png"},
    {"name": "Kara", "slug": "kara", "base_url": "https://www.kara.com.ng", "logo_url": None},
]

CATEGORIES = [
    {"name": "Phones & Tablets", "slug": "phones"},
    {"name": "Laptops", "slug": "laptops"},
    {"name": "Televisions", "slug": "televisions"},
    {"name": "Home Appliances", "slug": "home-appliances"},
    {"name": "Uncategorized", "slug": "uncategorized"},
]


def seed():
    db = SessionLocal()
    try:
        for s in STORES:
            if not db.query(Store).filter(Store.slug == s["slug"]).first():
                db.add(Store(**s))

        for c in CATEGORIES:
            if not db.query(Category).filter(Category.slug == c["slug"]).first():
                db.add(Category(**c))

        db.commit()
        print("Seeded stores and categories.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
