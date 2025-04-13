import axios from 'axios';

export interface TradeSummary {
  year: number;
  export: number;
  import_: number;
  trade_deficit: number;
}

export interface TradeSummaryResponse {
  reporter_id: number;
  partner_id: number;
  summary: {
    year: number;
    export: number;
    import_: number;
    trade_deficit: number;
  }[];
}

export interface TariffInfo {
  year: number;
  tariff_type: string;
  simple_average: number;
  weighted_average: number;
}

export interface TrumpTariffEntry {
  rate: number;
  date: string;
  description?: string;
}

export interface Country {
  id: number;
  iso3_code: string;
  name: string;
  trade_region?: string;
  tariffs_on_us_imports?: TariffInfo;
  us_tariffs_on_imports?: TariffInfo;
  trump_tariffs?: TrumpTariffEntry[];
}

export interface TradeDeficitEntry {
  country_id: string;
  country_name: string;
  deficit_thousands: number;
}

export interface TradeDeficitMapResponse {
  year: number;
  deficits: {
    country_id: string;
    country_name: string;
    deficit_thousands: number;
  }[];
}

export interface TradeDeficitArrayResponse {
  country_id: string;
  country_name: string;
}

export interface TariffMapResponse {
  tariffs: {
    country_code: string;
    country_name: string;
    claimed_tariff: number;
    reciprocal_tariff: number;
    is_region: boolean;
  }[];
}

export interface UsTariffMapResponse {
  tariffs: {
    country_id: string;
    country_code: string;
    country_name: string;
    tariff_rate_1: number;
    tariff_rate_2: number;
    date_1: string;
    date_2: string;
  }[];
}

export interface DeficitMapItem {
  country_id: string;
  country_code: string;
  country_name: string;
  deficit_thousands: number;
}

export interface DeficitMapResponse {
  year: number;
  deficits: DeficitMapItem[];
}

interface DeficitMapApiResponse {
  year: number;
  deficits: Array<{
    country_id: string;
    country_name: string;
    deficit_thousands: number;
  }>;
}

export interface TariffRanking {
  country_id: number;
  country_name: string;
  country_code: string;
  total_trade: number;
  tariff_on_us: number | null;
  us_tariff: number | null;
}

export interface TariffRankingsResponse {
  partners: TariffRanking[];
}

export interface DeficitRanking {
  country_id: number;
  country_name: string;
  country_code: string;
  exports: number;
  imports: number;
  deficit: number;
}

export interface DeficitRankingsResponse {
  rankings: DeficitRanking[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch trade summary between two countries or between a country and the world
 * @param reporterId ID of the reporting country
 * @param partnerId ID of the partner country (use 0 for world)
 * @param startYear Optional start year for the data range
 * @param endYear Optional end year for the data range
 * @returns Trade summary response
 */
export const fetchTradeSummary = async (
  reporterId: number,
  partnerId: number,
  startYear?: number,
  endYear?: number
): Promise<TradeSummaryResponse> => {
  try {
    const params = new URLSearchParams({
      reporter_id: reporterId.toString(),
      partner_id: partnerId.toString(),
    });

    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());

    const response = await axios.get<TradeSummaryResponse>(
      `${API_BASE_URL}/api/trade/summary?${params.toString()}`
    );
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
  return fetchTradeSummary(840, 0, startYear, endYear);
};

export const fetchTradeDeficitMap = async (
  reporterId: number = 840,
  year?: number
): Promise<TradeDeficitMapResponse> => {
  const params = new URLSearchParams();
  params.append('reporter_id', reporterId.toString());
  
  if (year) {
    params.append('year', year.toString());
  }
  
  const response = await axios.get(`${API_BASE_URL}/api/trade/deficit-map?${params.toString()}`);
  
  // Transform the response to match our frontend interface
  return {
    year: year || new Date().getFullYear(),
    deficits: response.data.deficits.map((item: any) => ({
      country_id: item.country_id,
      country_name: item.country_name,
      deficit_thousands: item.trade_balance_thousands  // Keep the original value as it's already a deficit
    }))
  };
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

/**
 * Fetch US tariff data for the map visualization
 * @returns US tariff map response
 */
export const fetchUsTariffMap = async (): Promise<UsTariffMapResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tariffs/us-tariff-map`);
    return response.data;
  } catch (error) {
    console.error('Error fetching US tariff map data:', error);
    throw error;
  }
};

export const fetchDeficitMap = async (reporterId: number = 840): Promise<DeficitMapResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('reporter_id', reporterId.toString());
    
    const response = await axios.get<DeficitMapResponse>(`${API_BASE_URL}/api/trade/deficit-map?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deficit map data:', error);
    throw error;
  }
};

/**
 * Fetch detailed information about a country including tariff data
 * @param countryId Numeric country ID (e.g., 840 for US)
 * @returns Country details including tariff information
 */
export const fetchCountryDetails = async (countryId: number): Promise<Country> => {
  try {
    const response = await axios.get<Country>(`${API_BASE_URL}/api/trade/country-details/${countryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching country details:', error);
    throw error;
  }
};

/**
 * Fetch tariff rankings between US and its top trading partners
 * @returns Tariff rankings response
 */
export const fetchTariffRankings = async (): Promise<TariffRankingsResponse> => {
  try {
    const response = await axios.get<TariffRankingsResponse>(
      `${API_BASE_URL}/api/tariffs/rankings`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tariff rankings:', error);
    throw error;
  }
};

/**
 * Fetch top countries with highest trade deficit with US
 * @returns Deficit rankings response
 */
export const fetchDeficitRankings = async (): Promise<DeficitRankingsResponse> => {
  try {
    const response = await axios.get<DeficitRankingsResponse>(
      `${API_BASE_URL}/api/trade/deficit-rankings`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching deficit rankings:', error);
    throw error;
  }
}; 