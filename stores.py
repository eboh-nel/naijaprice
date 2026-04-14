from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import products, search, stores, admin, alerts, categories
from app.database import engine
from app import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NaijaPrice API",
    description="Nigeria product price comparison engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(stores.router, prefix="/api/stores", tags=["stores"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(alerts.router, prefix="/api/user", tags=["alerts"])


@app.get("/health")
def health():
    return {"status": "ok"}
