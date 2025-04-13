from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..dependencies import get_supabase
from ..schemas.trade import Country, TradeSummary, TradeSummaryResponse, TradeDeficitMapResponse, TradeDeficitEntry, TariffInfo, TrumpTariffEntry
from ..utils.country_reference import (
    load_country_reference,
    get_iso3_by_id,
    get_name_by_id,
    get_trade_region_by_id
)
from ..cache import cache
import json
from datetime import datetime
from pathlib import Path

router = APIRouter(
    prefix="/api/trade",
    tags=["trade"]
)

def load_trump_tariffs() -> List[Dict[str, Any]]:
    """Load Trump tariff data from JSON file"""
    # Try to get from cache first
    cache_key = "trump_tariffs"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    data_path = Path(__file__).parent.parent.parent / 'data' / 'us_tariff_full_summary.json'
    with open(data_path, 'r') as f:
        data = json.load(f)
        
    # Cache the data with a long TTL (30 days) since it rarely changes
    cache.set(cache_key, data, ttl_seconds=86400 * 30)
    return data

@router.get("/countries", response_model=List[Country])
async def get_countries():
    """Get list of all countries"""
    # Try to get from cache first
    cache_key = "countries_list"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Load countries from reference data
        countries = load_country_reference()
        countries_list = list(countries.values())
        
        # Store in cache with a long TTL (30 days) since country list rarely changes
        cache.set(cache_key, countries_list, ttl_seconds=86400 * 30)
        
        return countries_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching countries: {str(e)}")

@router.get("/country-mappings", response_model=Dict[str, str])
async def get_country_mappings(supabase=Depends(get_supabase)):
    """Get mappings between different ISO code variants"""
    # Try to get from cache first
    cache_key = "country_mappings"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Query the tbl_country_code_mapping table
        response = supabase.table('tbl_country_code_mapping') \
            .select('iso_alpha3, alternative_code, source') \
            .execute()
        
        # Create a mapping from alternative codes to standard ISO codes
        mappings = {}
        for item in response.data:
            mappings[item['alternative_code']] = item['iso_alpha3']
        
        # Store in cache with a long TTL (30 days) since mappings rarely change
        cache.set(cache_key, mappings, ttl_seconds=86400 * 30)
        
        return mappings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching country mappings: {str(e)}")

@router.get("/summary", response_model=TradeSummaryResponse)
async def get_trade_summary(
    reporter_id: int = Query(..., description="ID of the reporting country"),
    partner_id: int = Query(..., description="ID of the partner country"),
    start_year: Optional[int] = Query(None, description="Start year for the data range"),
    end_year: Optional[int] = Query(None, description="End year for the data range"),
    supabase=Depends(get_supabase)
):
    """Get trade summary between two countries"""
    # Create a cache key based on the query parameters
    cache_key = f"trade_summary:{reporter_id}:{partner_id}:{start_year}:{end_year}"
    
    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Build the query using the view_trade_summary view
        query = supabase.table('view_trade_summary') \
            .select('year, export_value_usd, import_value_usd, trade_deficit_usd') \
            .eq('reporter_code', reporter_id) \
            .eq('partner_code', partner_id)
        
        # Add year filters if provided
        if start_year is not None:
            query = query.gte('year', start_year)
        if end_year is not None:
            query = query.lte('year', end_year)
            
        # Execute the query
        response = query.execute()
        
        # Process the results
        summary = []
        for item in response.data:
            summary.append({
                "year": item['year'],
                "export": item['export_value_usd'],
                "import_": item['import_value_usd'],
                "trade_deficit": item['trade_deficit_usd']
            })
        
        # Sort by year
        summary.sort(key=lambda x: x['year'])
        
        result = {
            "reporter_id": reporter_id,
            "partner_id": partner_id,
            "summary": summary
        }
        
        # Store in cache with a long TTL (7 days) since trade data rarely changes
        cache.set(cache_key, result, ttl_seconds=86400 * 7)
        
        return result
    except Exception as e:
        print(f"Debug - Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching trade summary: {str(e)}")

@router.post("/cache/clear")
async def clear_cache():
    """Clear the cache (admin endpoint)"""
    try:
        cache.clear()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")

@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics (admin endpoint)"""
    try:
        stats = cache.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting cache stats: {str(e)}")

@router.get("/cache/keys")
async def get_cache_keys():
    """Get all cache keys (admin endpoint)"""
    try:
        keys = cache.get_keys()
        return {"keys": keys}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting cache keys: {str(e)}")

@router.get("/deficit-map", response_model=TradeDeficitMapResponse)
async def get_trade_deficit_map(
    reporter_id: int = Query(..., description="ID of the reporting country"),
    year: Optional[int] = Query(None, description="Year to get data for (defaults to latest available)"),
    supabase=Depends(get_supabase)
):
    """Get trade deficit data for all countries against a specific reporting country"""
    # Create a cache key based on the parameters
    cache_key = f"trade_deficit_map:{reporter_id}:{year if year else 'latest'}"
    
    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Get reporter ISO3 code
        reporter_iso3 = get_iso3_by_id(reporter_id)
        if not reporter_iso3:
            raise HTTPException(status_code=400, detail="Invalid reporter country ID")
        
        # First, get the latest year if not specified
        if year is None:
            # Try to get the latest year from cache
            latest_year_cache_key = f"latest_year:{reporter_iso3}"
            cached_year = cache.get(latest_year_cache_key)
            
            if cached_year:
                year = cached_year
            else:
                year_response = supabase.table('vw_trade_deficits') \
                    .select('year') \
                    .eq('reporter_iso3', reporter_iso3) \
                    .order('year', desc=True) \
                    .limit(1) \
                    .execute()
                
                if not year_response.data:
                    raise HTTPException(status_code=404, detail=f"No trade data available for country ID {reporter_id}")
                
                year = year_response.data[0]['year']
                # Cache the latest year for 30 days
                cache.set(latest_year_cache_key, year, ttl_seconds=86400 * 30)
        
        # Get trade deficits for the specified year
        response = supabase.table('vw_trade_deficits') \
            .select('partner_iso3, trade_balance_thousands') \
            .eq('year', year) \
            .eq('reporter_iso3', reporter_iso3) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"No trade data found for year {year}")
        
        # Load country reference data
        countries = load_country_reference()
        iso3_to_id = {country['iso3_code']: country['id'] for country in countries.values()}
        
        # Format the response
        deficits = []
        for item in response.data:
            partner_iso3 = item['partner_iso3']
            if partner_iso3 in iso3_to_id:
                country_id = iso3_to_id[partner_iso3]
                country_name = get_name_by_id(country_id)
                
                # Format country_id to match World-Atlas format (3-digit string with leading zeros)
                formatted_id = f"{country_id:03d}"
                
                deficits.append(TradeDeficitEntry(
                    country_id=formatted_id,  # Use formatted string ID
                    country_code=partner_iso3,
                    country_name=country_name,
                    deficit_thousands=item['trade_balance_thousands']  # Remove the negation
                ))
        
        result = {
            "year": year,
            "deficits": deficits
        }
        
        # Store final result in cache with a long TTL (7 days)
        cache.set(cache_key, result, ttl_seconds=86400 * 7)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trade deficit map data: {str(e)}")

@router.get("/country-details/{country_id}", response_model=Country)
async def get_country_details(
    country_id: str,  # Accept string to handle both "004" and 4 formats
    supabase=Depends(get_supabase)
):
    """Get detailed information about a country including tariff data"""
    try:
        # Convert country_id to integer, handling both "004" and 4 formats
        try:
            numeric_id = int(country_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid country ID format. Must be a numeric value.")

        # Try to get from cache first
        cache_key = f"country_details:{country_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data

        # Get country reference data (already cached by @lru_cache)
        countries = load_country_reference()
        country = countries.get(numeric_id)
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")

        # Get Trump tariff data (now cached)
        trump_tariffs = load_trump_tariffs()
        trump_tariff_data = next(
            (item for item in trump_tariffs if item['id'] == numeric_id),
            None
        )

        # Format Trump tariff data
        trump_tariff_entries = []
        if trump_tariff_data:
            if trump_tariff_data.get('tariff_rate_1'):
                trump_tariff_entries.append(TrumpTariffEntry(
                    rate=float(trump_tariff_data['tariff_rate_1'].strip('%')),
                    date="2025-04-02",
                    description="First Trump tariff rate"
                ))
            if trump_tariff_data.get('tariff_rate_2'):
                trump_tariff_entries.append(TrumpTariffEntry(
                    rate=float(trump_tariff_data['tariff_rate_2'].strip('%')),
                    date="2025-04-09",
                    description="Second Trump tariff rate"
                ))

        # Get WTO tariff data
        tariff_query = (
            supabase.table('view_tariff_summary')
            .select('year, tariff_type, simple_average, weighted_average')
            .eq('reporter_code', numeric_id)
            .eq('partner_code', 840)  # US code
            .eq('tariff_type', 'AHS')
            .order('year', desc=True)
            .limit(1)
        )
        
        tariff_response = tariff_query.execute()
        tariffs_on_us = None
        if tariff_response.data:
            tariff_data = tariff_response.data[0]
            tariffs_on_us = TariffInfo(
                year=tariff_data['year'],
                tariff_type=tariff_data['tariff_type'],
                simple_average=tariff_data['simple_average'],
                weighted_average=tariff_data['weighted_average']
            )

        # Then, get tariffs imposed by US on the country's imports
        us_tariff_query = (
            supabase.table('view_tariff_summary')
            .select('year, tariff_type, simple_average, weighted_average')
            .eq('reporter_code', 840)  # US code
            .eq('partner_code', numeric_id)
            .eq('tariff_type', 'AHS')
            .order('year', desc=True)
            .limit(1)
        )
        
        us_tariff_response = us_tariff_query.execute()
        us_tariffs = None
        if us_tariff_response.data:
            tariff_data = us_tariff_response.data[0]
            us_tariffs = TariffInfo(
                year=tariff_data['year'],
                tariff_type=tariff_data['tariff_type'],
                simple_average=tariff_data['simple_average'],
                weighted_average=tariff_data['weighted_average']
            )

        # Combine all data
        result = Country(
            id=country['id'],
            iso3_code=country['iso3_code'],
            name=country['name'],
            trade_region=country.get('trade_region'),
            tariffs_on_us_imports=tariffs_on_us,
            us_tariffs_on_imports=us_tariffs,
            trump_tariffs=trump_tariff_entries
        )
        
        # Cache the final result with a shorter TTL (1 day) since WTO data might update
        cache.set(cache_key, result, ttl_seconds=86400)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching country details: {str(e)}")