/**
 * Format a trade value in USD to a human-readable string
 * @param value The trade value in USD (stored in thousands)
 * @param defaultUnit The default unit to use if the value is less than a billion (default: 'billion')
 * @returns Formatted string with appropriate unit
 */
export const formatTradeValue = (value: number, defaultUnit: 'billion' | 'million' | 'thousand' = 'billion'): string => {
  // Convert from thousands to actual value
  const actualValue = value * 1000;
  
  // Format based on size
  if (actualValue >= 1e9) {
    return `$${(actualValue / 1e9).toFixed(2)}B`;
  } else if (actualValue >= 1e6) {
    return `$${(actualValue / 1e6).toFixed(2)}M`;
  } else if (actualValue >= 1e3) {
    return `$${(actualValue / 1e3).toFixed(2)}K`;
  } else {
    return `$${actualValue.toFixed(2)}`;
  }
};

/**
 * Format a trade value in USD to a specific unit
 * @param value The trade value in USD (stored in thousands)
 * @param unit The unit to format to ('billion', 'million', 'thousand')
 * @returns Formatted string with the specified unit
 */
export const formatTradeValueToUnit = (value: number, unit: 'billion' | 'million' | 'thousand'): string => {
  // Convert from thousands to actual value
  const actualValue = value * 1000;
  
  // Format based on requested unit
  switch (unit) {
    case 'billion':
      return `$${(actualValue / 1e9).toFixed(2)}B`;
    case 'million':
      return `$${(actualValue / 1e6).toFixed(2)}M`;
    case 'thousand':
      return `$${(actualValue / 1e3).toFixed(2)}K`;
    default:
      return `$${actualValue.toFixed(2)}`;
  }
};

/**
 * Convert a trade value to a specific unit for calculations
 * @param value The trade value in USD (stored in thousands)
 * @param unit The unit to convert to ('billion', 'million', 'thousand')
 * @returns The value in the specified unit
 */
export const convertTradeValueToUnit = (value: number, unit: 'billion' | 'million' | 'thousand'): number => {
  // Convert from thousands to actual value
  const actualValue = value * 1000;
  
  // Convert to requested unit
  switch (unit) {
    case 'billion':
      return actualValue / 1e9;
    case 'million':
      return actualValue / 1e6;
    case 'thousand':
      return actualValue / 1e3;
    default:
      return actualValue;
  }
}; 