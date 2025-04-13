import json
from pathlib import Path
from typing import Dict, Optional, TypedDict
from functools import lru_cache

class CountryData(TypedDict):
    id: int
    iso3_code: str
    name: str
    trade_region: Optional[str]

@lru_cache()
def load_country_reference() -> Dict[int, CountryData]:
    """Load country reference data from JSON file and cache it"""
    data_path = Path(__file__).parent.parent.parent / 'data' / 'country_reference.json'
    with open(data_path, 'r') as f:
        countries = json.load(f)
    return {country['id']: country for country in countries}

def get_country_by_id(country_id: int) -> Optional[CountryData]:
    """Get country data by ID"""
    countries = load_country_reference()
    return countries.get(country_id)

def get_iso3_by_id(country_id: int) -> Optional[str]:
    """Get ISO3 code for a country ID"""
    country = get_country_by_id(country_id)
    return country['iso3_code'] if country else None

def get_trade_region_by_id(country_id: int) -> Optional[str]:
    """Get trade region for a country ID"""
    country = get_country_by_id(country_id)
    return country['trade_region'] if country else None

def get_name_by_id(country_id: int) -> Optional[str]:
    """Get country name for a country ID"""
    country = get_country_by_id(country_id)
    return country['name'] if country else None 