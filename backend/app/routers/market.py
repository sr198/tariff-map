from fastapi import APIRouter
from ..services.market_data import get_market_data

router = APIRouter()

@router.get("/market-data")
async def market_data():
    return get_market_data() 