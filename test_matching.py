from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.search_service import search_products
from app.schemas import SearchResponse

router = APIRouter()


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=2, description="Search query"),
    category: str | None = Query(None),
    store: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
):
    results = search_products(
        db=db,
        query=q,
        category=category,
        store=store,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
    )
    return SearchResponse(query=q, total=len(results), results=results)
