from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..dependencies import get_supabase
from ..schemas.trade import Country, TradeSummary, TradeSummaryResponse, TradeDeficitMapResponse, TradeDeficitEntry
from ..cache import cache
import json

router = APIRouter(
    prefix="/api/trade",
    tags=["trade"]
)

@router.get("/countries", response_model=List[Country])
async def get_countries(supabase=Depends(get_supabase)):
    """Get list of all countries"""
    # Try to get from cache first
    cache_key = "countries_list"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Query the tbl_countries table
        response = supabase.table('tbl_countries') \
            .select('iso_alpha3, name') \
            .order('name') \
            .execute()
        
        # Format the response to match the Country model
        countries_list = [
            {
                "iso_alpha3": item['iso_alpha3'],
                "name": item['name']
            }
            for item in response.data
        ]
        
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
    reporter_iso3: str = Query(..., description="ISO3 code of the reporting country"),
    partner_iso3: str = Query(..., description="ISO3 code of the partner country (use 'WLD' for world)"),
    start_year: Optional[int] = Query(None, description="Start year for the data range"),
    end_year: Optional[int] = Query(None, description="End year for the data range"),
    supabase=Depends(get_supabase)
):
    """
    Get trade summary between two countries or between a country and the world
    """
    # Create a cache key based on the query parameters
    cache_key = f"trade_summary:{reporter_iso3}:{partner_iso3}:{start_year}:{end_year}"
    
    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
        # Get country mappings
        mappings_response = supabase.table('tbl_country_code_mapping') \
            .select('iso_alpha3, alternative_code') \
            .execute()
        
        # Create a mapping from alternative codes to standard ISO codes
        mappings = {}
        for item in mappings_response.data:
            mappings[item['alternative_code']] = item['iso_alpha3']
        
        # Map the reporter and partner codes if needed
        mapped_reporter_iso3 = mappings.get(reporter_iso3, reporter_iso3)
        mapped_partner_iso3 = mappings.get(partner_iso3, partner_iso3)
        
        # Build the query
        query = supabase.table('tbl_trade_transactions') \
            .select('year, trade_flow, trade_value_usd') \
            .eq('reporter_iso3', mapped_reporter_iso3) \
            .eq('partner_iso3', mapped_partner_iso3)
        
        # Add year filters if provided
        if start_year is not None:
            query = query.gte('year', start_year)
        if end_year is not None:
            query = query.lte('year', end_year)
        
        # Execute the query
        response = query.execute()
        
        # Process the results
        yearly_data = {}
        for item in response.data:
            year = item['year']
            if year not in yearly_data:
                yearly_data[year] = {
                    "year": year,
                    "export": 0,
                    "import_": 0,
                    "trade_deficit": 0
                }
            
            if item['trade_flow'] == 'Export':
                yearly_data[year]['export'] += item['trade_value_usd']
            elif item['trade_flow'] == 'Import':
                yearly_data[year]['import_'] += item['trade_value_usd']
        
        # Calculate trade deficit for each year
        for year_data in yearly_data.values():
            year_data['trade_deficit'] = year_data['import_'] - year_data['export']
        
        # Convert to list and sort by year
        summary = sorted(yearly_data.values(), key=lambda x: x['year'])
        
        result = {
            "reporter": reporter_iso3,  # Use the original code in the response
            "partner": partner_iso3,    # Use the original code in the response
            "summary": summary
        }
        
        # Store in cache with a long TTL (7 days) since trade data rarely changes
        cache.set(cache_key, result, ttl_seconds=86400 * 7)
        
        return result
    except Exception as e:
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
    reporter_iso3: str = Query('USA', description="ISO3 code of the reporting country (defaults to USA)"),
    year: Optional[int] = Query(None, description="Year to get data for (defaults to latest available)"),
    supabase=Depends(get_supabase)
):
    """
    Get trade deficit data for all countries against a specific reporting country
    Used for generating the trade deficit heatmap
    """
    # Create a cache key based on the parameters
    cache_key = f"trade_deficit_map:{reporter_iso3}:{year if year else 'latest'}"
    
    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    try:
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
                    raise HTTPException(status_code=404, detail=f"No trade data available for {reporter_iso3}")
                
                year = year_response.data[0]['year']
                # Cache the latest year for 30 days
                cache.set(latest_year_cache_key, year, ttl_seconds=86400 * 30)
        
        # Try to get country names from cache
        countries_cache_key = "countries_names"
        country_names = cache.get(countries_cache_key)
        
        if not country_names:
            # Get country names
            countries_response = supabase.table('tbl_countries') \
                .select('iso_alpha3, name') \
                .execute()
            
            # Create a mapping of country codes to names
            country_names = {item['iso_alpha3']: item['name'] for item in countries_response.data}
            
            # Cache country names for 30 days
            cache.set(countries_cache_key, country_names, ttl_seconds=86400 * 30)
        
        # Get trade deficits for the specified year
        deficits_cache_key = f"trade_deficits:{reporter_iso3}:{year}"
        cached_deficits = cache.get(deficits_cache_key)
        
        if cached_deficits:
            deficits_data = cached_deficits
        else:
            response = supabase.table('vw_trade_deficits') \
                .select('partner_iso3, trade_balance_thousands') \
                .eq('year', year) \
                .eq('reporter_iso3', reporter_iso3) \
                .execute()
            
            deficits_data = response.data
            # Cache deficits data for 7 days
            cache.set(deficits_cache_key, deficits_data, ttl_seconds=86400 * 7)
        
        # Format the response
        deficits = [
            TradeDeficitEntry(
                country_code=item['partner_iso3'],
                country_name=country_names.get(item['partner_iso3'], item['partner_iso3']),
                deficit_thousands=item['trade_balance_thousands']
            )
            for item in deficits_data
        ]
        
        result = {
            "year": year,
            "deficits": deficits
        }
        
        # Store final result in cache with a long TTL (7 days)
        cache.set(cache_key, result, ttl_seconds=86400 * 7)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trade deficit map data: {str(e)}")