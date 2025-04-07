import React, { useState, useEffect } from 'react';
import { fetchCountries } from '@/services/tradeService';

interface CountryDropdownProps {
  onCountrySelect: (countryCode: string) => void;
  className?: string;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({ onCountrySelect, className = '' }) => {
  const [countries, setCountries] = useState<{ iso_alpha3: string; name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCountries();
        setCountries(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Error loading countries:', err);
        setError('Failed to load countries');
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, []);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value;
    setSelectedCountry(countryCode);
    onCountrySelect(countryCode);
  };

  if (isLoading) {
    return (
      <div className={`w-full p-2 bg-gray-100 rounded-lg ${className}`}>
        <select disabled className="w-full p-2 bg-transparent">
          <option>Loading countries...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full p-2 bg-red-50 text-red-600 rounded-lg ${className}`}>
        Error loading countries: {error}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <select
        value={selectedCountry}
        onChange={handleCountryChange}
        className="w-full p-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a country</option>
        {countries.map((country) => (
          <option key={country.iso_alpha3} value={country.iso_alpha3}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountryDropdown; 