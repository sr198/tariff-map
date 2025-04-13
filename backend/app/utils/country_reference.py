import json
from pathlib import Path
from typing import Dict, Optional, TypedDict, Any
from functools import lru_cache
from ..utils.json_cache import json_cache

class CountryData(TypedDict):
    id: int
    iso3_code: str
    name: str
    trade_region: Optional[str]

@lru_cache(maxsize=1)
def load_country_reference() -> Dict[int, CountryData]:
    """Load country reference data from cache"""
    data = json_cache.get_country_reference()
    # Convert list to dictionary with id as key
    return {country['id']: country for country in data}

def get_country_by_id(country_id: int) -> Optional[CountryData]:
    """Get country data by ID"""
    countries = load_country_reference()
    return countries.get(country_id)

def get_iso3_by_id(country_id: int) -> Optional[str]:
    """Get ISO3 code by country ID"""
    country = get_country_by_id(country_id)
    return country['iso3_code'] if country else None

def get_name_by_id(country_id: int) -> Optional[str]:
    """Get country name by ID"""
    country = get_country_by_id(country_id)
    return country['name'] if country else None

def get_trade_region_by_id(country_id: int) -> Optional[str]:
    """Get trade region by country ID"""
    country = get_country_by_id(country_id)
    return country['trade_region'] if country else None 