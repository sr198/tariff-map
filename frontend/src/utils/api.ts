// API configuration
// Get API URL from environment variables with fallbacks
const getApiUrl = (): string => {
  // Try to get from environment variables
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback to hardcoded value
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

// API endpoints
export const ENDPOINTS = {
  COUNTRIES: `${API_URL}/trade/countries`,
  TARIFFS: `${API_URL}/api/tariffs`,
  TRADE: `${API_URL}/trade`,
  COUNTRY_DETAILS: (countryCode: string) => `${API_URL}/trade/country-details/${countryCode}`,
};

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper function to format currency values
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percentage values
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
}; 