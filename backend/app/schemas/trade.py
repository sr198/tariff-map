from pydantic import BaseModel
from typing import List

class Country(BaseModel):
    iso_alpha3: str
    name: str

class TradeSummary(BaseModel):
    year: int
    export: float
    import_: float
    trade_deficit: float

class TradeSummaryResponse(BaseModel):
    reporter: str
    partner: str
    summary: List[TradeSummary]

class TradeDeficitEntry(BaseModel):
    country_code: str
    country_name: str
    deficit_thousands: float  # Trade deficit in thousands USD

class TradeDeficitMapResponse(BaseModel):
    year: int
    deficits: List[TradeDeficitEntry] 