from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from datetime import date
from supabase import Client

from ..dependencies import get_supabase

router = APIRouter(
    prefix="/api/tariffs",
    tags=["tariffs"],
    responses={404: {"description": "Not found"}},
)

@router.get("/year/{year}")
async def get_tariffs_by_year(
    year: int, 
    country_code: Optional[str] = Query(None, description="Optional country code to filter by"),
    supabase: Client = Depends(get_supabase)
):
    """
    Get all tariff rates for a specific year, optionally filtered by country
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
        
        result = query.execute()
        
        if not result.data:
            country_text = f" for {country_code}" if country_code else ""
            raise HTTPException(status_code=404, detail=f"No tariff data found for {year}{country_text}")
        
        return {
            "year": year,
            "country_code": country_code,
            "tariff_rates": result.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tariff rates: {str(e)}")

@router.get("/country-pair/{imposing_country}/{target_country}/{year}")
async def get_country_pair_tariff(
    imposing_country: str, 
    target_country: str, 
    year: int, 
    supabase: Client = Depends(get_supabase)
):
    """
    Get tariff rate between two countries for a specific year
    """
    try:
        # Convert year to date range
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        
        result = supabase.table("tbl_tariff_rates") \
            .select("*") \
            .eq("imposing_iso3", imposing_country) \
            .eq("target_iso3", target_country) \
            .gte("tariff_date", start_date.isoformat()) \
            .lte("tariff_date", end_date.isoformat()) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=404, 
                detail=f"No tariff data found for {imposing_country}-{target_country} in {year}"
            )
        
        # Calculate average tariff for the year
        tariffs = [item["avg_tariff"] for item in result.data if item["avg_tariff"] is not None]
        avg_tariff = sum(tariffs) / len(tariffs) if tariffs else None
        
        return {
            "year": year,
            "imposing_country": imposing_country,
            "target_country": target_country,
            "avg_tariff": avg_tariff,
            "tariff_data": result.data
        }
    except HTTPException:
        raise
    except Exception as e:
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
    """
    Get tariff data for map visualization from tbl_trump_tariff table
    """
    try:
        result = supabase.table("tbl_trump_tariff") \
            .select("partner_iso3, partner_name, trump_claimed_tariff, us_reciprocal_tariff") \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="No tariff data found")
        
        # Get the current year for the response
        current_year = date.today().year
        
        # Filter out any null values for us_reciprocal_tariff
        valid_data = [item for item in result.data if item["us_reciprocal_tariff"] is not None]
        
        return {
            "year": current_year,
            "tariffs": [
                {
                    "country_code": item["partner_iso3"],
                    "country_name": item["partner_name"] or "Unknown",
                    "trump_claimed_tariff": item["trump_claimed_tariff"],
                    "us_reciprocal_tariff": item["us_reciprocal_tariff"]
                }
                for item in valid_data
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tariff map data: {str(e)}") 