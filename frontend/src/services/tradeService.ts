import axios from 'axios';

export interface TradeSummary {
  year: number;
  export: number;
  import_: number;
  trade_deficit: number;
}

export interface TradeSummaryResponse {
  reporter: string;
  partner: string;
  summary: TradeSummary[];
}

export interface Country {
  iso_alpha3: string;
  name: string;
}

export interface TradeDeficitEntry {
  country_code: string;
  country_name: string;
  deficit_thousands: number;
  export_thousands: number;
  import_thousands: number;
}

export interface TradeDeficitMapResponse {
  year: number;
  deficits: TradeDeficitEntry[];
}

export interface TariffMapResponse {
  year: number;
  tariffs: {
    country_code: string;
    country_name: string;
    trump_claimed_tariff: number;
    us_reciprocal_tariff: number;
  }[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch trade summary between two countries or between a country and the world
 * @param reporterIso3 ISO3 code of the reporting country
 * @param partnerIso3 ISO3 code of the partner country (use 'WLD' for world)
 * @param startYear Optional start year for the data range
 * @param endYear Optional end year for the data range
 * @returns Trade summary response
 */
export const fetchTradeSummary = async (
  reporterIso3: string,
  partnerIso3: string,
  startYear?: number,
  endYear?: number
): Promise<TradeSummaryResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('reporter_iso3', reporterIso3);
    params.append('partner_iso3', partnerIso3);
    
    if (startYear) {
      params.append('start_year', startYear.toString());
    }
    
    if (endYear) {
      params.append('end_year', endYear.toString());
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/trade/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trade summary:', error);
    throw error;
  }
};

/**
 * Fetch list of all countries
 * @returns List of countries
 */
export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trade/countries`);
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

/**
 * Fetch country code mappings
 * @returns Mapping from alternative codes to standard ISO codes
 */
export const fetchCountryMappings = async (): Promise<Record<string, string>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/trade/country-mappings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching country mappings:', error);
    throw error;
  }
};

/**
 * Fetch US trade overview with the world
 * @param startYear Optional start year for the data range
 * @param endYear Optional end year for the data range
 * @returns Trade summary response
 */
export const fetchUSTradeOverview = async (
  startYear?: number,
  endYear?: number
): Promise<TradeSummaryResponse> => {
  return fetchTradeSummary('USA', 'WLD', startYear, endYear);
};

export const fetchTradeDeficitMap = async (
  reporterIso3: string = 'USA',
  year?: number
): Promise<TradeDeficitMapResponse> => {
  const params = new URLSearchParams();
  if (year) {
    params.append('year', year.toString());
  }
  if (reporterIso3 !== 'USA') {
    params.append('reporter_iso3', reporterIso3);
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/trade/deficit-map?${params.toString()}`);
  return response.data;
};

/**
 * Fetch tariff data for the map visualization
 * @returns Tariff map response
 */
export const fetchTariffMap = async (): Promise<TariffMapResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tariffs/map`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tariff map data:', error);
    throw error;
  }
}; 