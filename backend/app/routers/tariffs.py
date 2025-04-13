from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from datetime import date
from supabase import Client
import json

from ..dependencies import get_supabase
from ..utils.country_reference import (
    get_iso3_by_id,
    get_name_by_id,
    get_trade_region_by_id,
    load_country_reference
)

router = APIRouter(
    prefix="/api/tariffs",
    tags=["tariffs"],
    responses={404: {"description": "Not found"}},
)

@router.get("/year/{year}")
async def get_tariffs_by_year(
    year: int, 
    country_id: Optional[int] = Query(None, description="Optional country ID to filter by"),
    supabase: Client = Depends(get_supabase)
):
    """
    Get all tariff rates for a specific year, optionally filtered by country
    """
    try:
        # Convert year to date range
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        
        if country_id:
            # Get country ISO3 and trade region
            country_iso3 = get_iso3_by_id(country_id)
            trade_region = get_trade_region_by_id(country_id)
            
            if not country_iso3:
                raise HTTPException(status_code=400, detail="Invalid country ID")
            
            # Build query considering both country and its trade region
            query = supabase.table("tbl_tariff_rates") \
                .select("*") \
                .gte("tariff_date", start_date.isoformat()) \
                .lte("tariff_date", end_date.isoformat())
            
            # Handle trade region in the query
            if trade_region:
                query = query.or_(
                    f"imposing_iso3.eq.{country_iso3},"
                    f"target_iso3.eq.{country_iso3},"
                    f"imposing_region.eq.{trade_region},"
                    f"target_region.eq.{trade_region}"
                )
            else:
                query = query.or_(
                    f"imposing_iso3.eq.{country_iso3},target_iso3.eq.{country_iso3}"
                )
        else:
            # If no country specified, get all tariffs for the year
            query = supabase.table("tbl_tariff_rates") \
                .select("*") \
                .gte("tariff_date", start_date.isoformat()) \
                .lte("tariff_date", end_date.isoformat())
        
        result = query.execute()
        
        if not result.data:
            country_text = f" for country ID {country_id}" if country_id else ""
            raise HTTPException(status_code=404, detail=f"No tariff data found for {year}{country_text}")
        
        return {
            "year": year,
            "country_id": country_id,
            "tariff_rates": result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tariff rates: {str(e)}")

@router.get("/country-pair/{imposing_country_id}/{target_country_id}")
async def get_country_pair_tariff(
    imposing_country_id: int, 
    target_country_id: int,
    supabase: Client = Depends(get_supabase)
):
    """Get tariff rates between two countries or regions"""
    try:
        # For now, we only have US imposed tariffs in tbl_trump_tariff
        if imposing_country_id != 840:  # 840 is USA
            raise HTTPException(
                status_code=404,
                detail="Currently only US imposed tariffs are available"
            )
        
        # Get ISO3 code and trade region for target country
        target_iso3 = get_iso3_by_id(target_country_id)
        target_region = get_trade_region_by_id(target_country_id)
        
        if not target_iso3:
            raise HTTPException(status_code=400, detail="Invalid target country ID")
            
        print(f"Debug - Looking up tariffs for target ISO3: {target_iso3}, region: {target_region}")
        
        # Query the trump tariff table - first try exact country match
        result = supabase.table("tbl_trump_tariff") \
            .select("partner_iso3, partner_name, trump_claimed_tariff, us_reciprocal_tariff") \
            .eq("partner_iso3", target_iso3) \
            .execute()
            
        # If no direct country match and country has a trade region, try the region
        if not result.data and target_region:
            print(f"Debug - No country match found, trying region: {target_region}")
            result = supabase.table("tbl_trump_tariff") \
                .select("partner_iso3, partner_name, trump_claimed_tariff, us_reciprocal_tariff") \
                .eq("partner_iso3", target_region) \
                .execute()
            
        print(f"Debug - Query result: {result.data}")
        
        if not result.data:
            error_msg = f"No tariff data found between US and "
            error_msg += f"country with ID {target_country_id}"
            if target_region:
                error_msg += f" or its trade region {target_region}"
            raise HTTPException(status_code=404, detail=error_msg)
        
        tariff_data = result.data[0]
        return {
            "imposing_country_id": imposing_country_id,
            "target_country_id": target_country_id,
            "target_iso3": target_iso3,
            "target_name": get_name_by_id(target_country_id),
            "matched_code": tariff_data["partner_iso3"],  # This could be country or region code
            "matched_name": tariff_data["partner_name"],
            "is_region_tariff": tariff_data["partner_iso3"] != target_iso3,
            "claimed_tariff": tariff_data["trump_claimed_tariff"],
            "reciprocal_tariff": tariff_data["us_reciprocal_tariff"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Debug - Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching tariff rate: {str(e)}")

@router.get("/historical/{country_code}")
async def get_historical_tariffs(
    country_code: str,
    partner: Optional[str] = Query(None, description="Optional partner country code to filter by"),
    start_year: Optional[int] = Query(None, description="Start year for historical data"),
    end_year: Optional[int] = Query(None, description="End year for historical data"),
    supabase: Client = Depends(get_supabase)
):
    """
    Get historical tariff rates for a country over a range of years
    """
    try:
        # Build the query based on whether we're looking at tariffs imposed by or on the country
        query = supabase.table("tbl_tariff_rates") \
            .select("*") \
            .or_(f"imposing_iso3.eq.{country_code},target_iso3.eq.{country_code}")
        
        # Filter by partner if provided
        if partner:
            query = query.or_(f"imposing_iso3.eq.{partner},target_iso3.eq.{partner}")
        
        # Add date range filters
        if start_year:
            start_date = date(start_year, 1, 1)
            query = query.gte("tariff_date", start_date.isoformat())
        if end_year:
            end_date = date(end_year, 12, 31)
            query = query.lte("tariff_date", end_date.isoformat())
        
        result = query.order("tariff_date", desc=False).execute()
        
        if not result.data:
            partner_text = f"-{partner}" if partner else ""
            raise HTTPException(
                status_code=404, 
                detail=f"No tariff data found for {country_code}{partner_text}"
            )
        
        # Group by year and calculate average
        yearly_data = {}
        for item in result.data:
            tariff_date = date.fromisoformat(item["tariff_date"])
            year = tariff_date.year
            
            if year not in yearly_data:
                yearly_data[year] = []
            
            if item["avg_tariff"] is not None:
                yearly_data[year].append(item["avg_tariff"])
        
        # Format the response
        historical_data = []
        for year, tariffs in yearly_data.items():
            if tariffs:
                historical_data.append({
                    "year": year,
                    "avg_tariff": sum(tariffs) / len(tariffs)
                })
        
        return {
            "country_code": country_code,
            "partner": partner,
            "historical_data": historical_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical tariff data: {str(e)}")

@router.get("/highest/{year}")
async def get_highest_tariffs(
    year: int, 
    country_code: Optional[str] = Query(None, description="Optional country code to filter by"),
    limit: int = Query(10, description="Number of highest tariffs to return"),
    supabase: Client = Depends(get_supabase)
):
    """
    Get the highest tariff rates for a specific year, optionally filtered by country
    """
    try:
        # Convert year to date range
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        
        query = supabase.table("tbl_tariff_rates") \
            .select("*") \
            .gte("tariff_date", start_date.isoformat()) \
            .lte("tariff_date", end_date.isoformat())
        
        # Filter by country if provided
        if country_code:
            query = query.or_(f"imposing_iso3.eq.{country_code},target_iso3.eq.{country_code}")
        
        result = query.order("avg_tariff", desc=True).limit(limit).execute()
        
        if not result.data:
            country_text = f" for {country_code}" if country_code else ""
            raise HTTPException(status_code=404, detail=f"No tariff data found for {year}{country_text}")
        
        # Format the response
        highest_tariffs = []
        for item in result.data:
            highest_tariffs.append({
                "imposing_country": item["imposing_iso3"],
                "target_country": item["target_iso3"],
                "avg_tariff": item["avg_tariff"],
                "tariff_date": item["tariff_date"],
                "product_group": item["product_group"]
            })
        
        return {
            "year": year,
            "country_code": country_code,
            "highest_tariffs": highest_tariffs
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching highest tariff rates: {str(e)}")

@router.get("/map")
async def get_tariff_map(supabase: Client = Depends(get_supabase)):
    """Get all tariff data for map visualization"""
    try:
        result = supabase.table("tbl_trump_tariff") \
            .select("partner_iso3, partner_name, trump_claimed_tariff, us_reciprocal_tariff") \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="No tariff data found")
        
        # Load country reference data
        countries = load_country_reference()
        iso3_to_id = {country['iso3_code']: country['id'] for country in countries.values()}
        
        # Filter out any null values for us_reciprocal_tariff
        valid_data = [item for item in result.data if item["us_reciprocal_tariff"] is not None]
        
        return {
            "tariffs": [
                {
                    "country_id": f"{iso3_to_id[item['partner_iso3']]:03d}" if item['partner_iso3'] in iso3_to_id else None,
                    "country_code": item["partner_iso3"],
                    "country_name": item["partner_name"] or "Unknown",
                    "claimed_tariff": item["trump_claimed_tariff"],
                    "reciprocal_tariff": item["us_reciprocal_tariff"],
                    "is_region": len(item["partner_iso3"]) == 3 and item["partner_iso3"].endswith('U')  # Simple check for region codes like EUU
                }
                for item in valid_data
            ]
        }
    except Exception as e:
        print(f"Debug - Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching tariff map data: {str(e)}")

@router.get("/us-tariff-map")
async def get_us_tariff_map():
    """
    Get US tariff data for map visualization
    Returns tariff rates for all countries with two dates
    """
    try:
        # Read the JSON file
        with open("data/us_tariff_full_summary.json", "r") as f:
            tariff_data = json.load(f)
        
        # Format the response
        return {
            "tariffs": [
                {
                    "country_id": f"{item['id']:03d}",  # Format as 3-digit string
                    "country_code": item["iso3_code"],
                    "country_name": item["name"],
                    "tariff_rate_1": float(item["tariff_rate_1"].strip("%")),
                    "tariff_rate_2": float(item["tariff_rate_2"].strip("%")),
                    "date_1": "2025-04-02",
                    "date_2": "2025-04-09"
                }
                for item in tariff_data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching US tariff map data: {str(e)}") 