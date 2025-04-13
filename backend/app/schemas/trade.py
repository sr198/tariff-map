from pydantic import BaseModel
from typing import List, Optional

class TariffInfo(BaseModel):
    year: int
    tariff_type: str
    simple_average: float
    weighted_average: float

class TrumpTariffEntry(BaseModel):
    rate: float
    date: str
    description: Optional[str] = None

class Country(BaseModel):
    id: int
    iso3_code: str
    name: str
    trade_region: Optional[str] = None
    tariffs_on_us_imports: Optional[TariffInfo] = None
    us_tariffs_on_imports: Optional[TariffInfo] = None
    trump_tariffs: Optional[List[TrumpTariffEntry]] = None

class TradeSummary(BaseModel):
    year: int
    export: float
    import_: float
    trade_deficit: float

class TradeSummaryResponse(BaseModel):
    reporter_id: int
    partner_id: int
    summary: List[TradeSummary]

class TradeDeficitEntry(BaseModel):
    country_id: int
    country_code: str
    country_name: str
    deficit_thousands: float  # Trade deficit in thousands USD

class TradeDeficitMapResponse(BaseModel):
    year: int
    deficits: List[TradeDeficitEntry] 