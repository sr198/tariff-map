# Tariff Map API

This is the backend API for the Tariff Map application, built with FastAPI and Supabase.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the `backend` directory with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

3. Start the API server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`.

## API Endpoints

### Trade Data

- `GET /api/trade/total/{year}?country_code=USA`
  - Get total trade data for a country in a specific year
  - Default country is USA if not specified

- `GET /api/trade/country-pair/{reporter}/{partner}/{year}`
  - Get trade data between two countries for a specific year

- `GET /api/trade/top-partners/{year}?country_code=USA`
  - Get top trading partners for a country in a specific year
  - Default country is USA if not specified

- `GET /api/trade/historical/{country_code}?partner=CHN`
  - Get historical trade data for a country
  - Optional partner parameter to filter by specific country pair

### Tariff Data

- `GET /api/tariffs/year/{year}?country_code=USA`
  - Get all tariff rates for a specific year
  - Optional country filter (defaults to all countries)

- `GET /api/tariffs/country-pair/{imposing_country}/{target_country}/{year}`
  - Get tariff rate between two countries for a specific year

- `GET /api/tariffs/historical/{country_code}?partner=CHN&start_year=2020&end_year=2023`
  - Get historical tariff rates for a country
  - Optional partner, start_year, and end_year parameters

- `GET /api/tariffs/highest/{year}?country_code=USA&limit=10`
  - Get the highest tariff rates for a specific year
  - Optional country filter and limit parameter

### Countries

- `GET /api/countries`
  - Get list of all countries in the database

## Database Schema

The API uses the following tables in Supabase:

### tbl_countries
- `iso3` (text, primary key): ISO 3-letter country code
- `name` (text): Country name
- `region` (text): Geographic region
- `income_group` (text): World Bank income group classification

### tbl_trade_summary
- `id` (uuid, primary key): Unique identifier
- `reporter_iso3` (text): ISO 3-letter code of reporting country
- `partner_iso3` (text): ISO 3-letter code of partner country
- `year` (integer): Year of trade data
- `import_value` (numeric): Total import value in USD
- `export_value` (numeric): Total export value in USD
- `trade_balance` (numeric): Net trade balance (exports - imports)

### tbl_tariff_rates
- `id` (uuid, primary key): Unique identifier
- `imposing_iso3` (text): ISO 3-letter code of country imposing tariff
- `target_iso3` (text): ISO 3-letter code of country being targeted
- `tariff_date` (date): Date of tariff implementation
- `product_group` (text): Product category or group
- `avg_tariff` (numeric): Average tariff rate percentage
- `notes` (text): Additional information about the tariff

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error responses include a detail message explaining the error. 