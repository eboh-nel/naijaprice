"""
Pytest configuration and shared fixtures.

Uses SQLite in-memory DB so tests run without PostgreSQL or Docker.
Compatible with SQLAlchemy 2.x session API.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Store, Category, Product, ProductVariant  # noqa: register models

TEST_DATABASE_URL = "sqlite:///./test_naijaprice.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    import os
    if os.path.exists("test_naijaprice.db"):
        os.remove("test_naijaprice.db")


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    session.begin_nested()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def seed_store(db):
    store = Store(name="TestStore", slug="teststore", base_url="https://teststore.ng", is_active=True)
    db.add(store)
    db.flush()
    return store


@pytest.fixture()
def seed_category(db):
    cat = Category(name="Test Phones", slug="test-phones")
    db.add(cat)
    db.flush()
    return cat


@pytest.fixture()
def seed_product(db, seed_category):
    product = Product(
        brand="Samsung",
        model="Galaxy A15",
        normalized_name="samsung galaxy a15",
        slug="samsung-galaxy-a15",
        category_id=seed_category.id,
    )
    db.add(product)
    db.flush()
    return product


@pytest.fixture()
def seed_variant(db, seed_product):
    variant = ProductVariant(
        product_id=seed_product.id,
        storage="128GB",
        ram="4GB",
        color="Black",
        variant_key="SAMSUNG|GALAXY A15|128GB|4GB",
    )
    db.add(variant)
    db.flush()
    return variant
