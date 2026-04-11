from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Store
from app.schemas import StoreOut

router = APIRouter()


@router.get("", response_model=list[StoreOut])
def list_stores(db: Session = Depends(get_db)):
    return db.query(Store).filter(Store.is_active == True).all()


@router.get("/{slug}", response_model=StoreOut)
def get_store(slug: str, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Store not found")
    return store
