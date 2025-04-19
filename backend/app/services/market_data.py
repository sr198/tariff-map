from datetime import datetime, timedelta
import yfinance as yf
from fastapi import HTTPException
from ..cache import get_cache, set_cache

CACHE_KEY = "market_data"
CACHE_TTL = 1800  # 30 minutes in seconds

def get_market_data():
    # Try to get cached data first
    cached_data = get_cache(CACHE_KEY)
    if cached_data:
        return cached_data

    try:
        # Fetch data from Yahoo Finance
        symbols = {
            "SPY": "S&P 500 ETF",
            "^TNX": "10Y Treasury Yield",
            "DX-Y.NYB": "USD Index",
            "CL=F": "Crude Oil",
            "EEM": "Emerging Markets ETF",
            "XLI": "Industrial Sector ETF"
        }
        
        data = {}
        for symbol, name in symbols.items():
            ticker = yf.Ticker(symbol)
            
            # Get current price and daily change
            info = ticker.info
            current_price = info.get('regularMarketPrice', 0)
            previous_close = info.get('regularMarketPreviousClose', 0)
            daily_change = current_price - previous_close
            daily_change_percent = (daily_change / previous_close) * 100 if previous_close else 0
            
            # Get historical data for 90 days
            end_date = datetime.now()
            start_date_90d = end_date - timedelta(days=90)
            start_date_30d = end_date - timedelta(days=30)
            
            # Fetch 90 days of data
            hist = ticker.history(start=start_date_90d, end=end_date)
            
            if not hist.empty:
                # Get reference prices
                price_90d_ago = hist['Close'].iloc[0]
                price_30d_ago = hist['Close'].iloc[-30] if len(hist) >= 30 else price_90d_ago
                
                # Calculate changes
                change_90d = current_price - price_90d_ago
                change_90d_percent = (change_90d / price_90d_ago) * 100 if price_90d_ago else 0
                
                change_30d = current_price - price_30d_ago
                change_30d_percent = (change_30d / price_30d_ago) * 100 if price_30d_ago else 0
            else:
                price_90d_ago = 0
                price_30d_ago = 0
                change_90d = 0
                change_90d_percent = 0
                change_30d = 0
                change_30d_percent = 0
            
            data[symbol] = {
                "name": name,
                "price": round(current_price, 2),
                "daily_change": round(daily_change, 2),
                "daily_change_percent": round(daily_change_percent, 2),
                "change_30d": round(change_30d, 2),
                "change_30d_percent": round(change_30d_percent, 2),
                "change_90d": round(change_90d, 2),
                "change_90d_percent": round(change_90d_percent, 2),
                "last_updated": datetime.now().isoformat()
            }
        
        # Cache the data
        set_cache(CACHE_KEY, data, CACHE_TTL)
        return data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}") 