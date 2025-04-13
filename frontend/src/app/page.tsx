'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CountryDetails from '@/components/CountryDetails';
import GlobalStats from '@/components/GlobalStats';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchCountries } from '@/services/tradeService';
import AdComponent from '@/components/AdComponent';
import UsTariffMap from '@/components/UsTariffMap';
import UsDeficitMap from '../components/UsDeficitMap';

// Dynamically import the map components to avoid SSR issues
const UsTariffMapComponent = dynamic(() => import('@/components/UsTariffMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[21/9] bg-gray-100 flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

// Main component
export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code: string } | null>(null);
  const [activeMap, setActiveMap] = useState<'tariff' | 'deficit'>('tariff');
  const [countryNameToCode, setCountryNameToCode] = useState<Record<string, string>>({});
  const [countryCodeToName, setCountryCodeToName] = useState<Record<string, string>>({});
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  // Fetch countries from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingCountries(true);
        
        // Fetch countries
        const countries = await fetchCountries();
        
        // Create mappings of country names to ISO codes and vice versa
        const nameToCode: Record<string, string> = {};
        const codeToName: Record<string, string> = {};
        
        countries.forEach(country => {
          nameToCode[country.name] = country.iso3_code;
          codeToName[country.iso3_code] = country.name;
        });
        
        setCountryNameToCode(nameToCode);
        setCountryCodeToName(codeToName);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadData();
  }, []);

  // Get the country code for the selected country
  const getCountryCode = useCallback((countryName: string): string | undefined => {
    let code = countryNameToCode[countryName];
    
    if (!code) {
      const countryEntries = Object.entries(countryNameToCode);
      const closeMatch = countryEntries.find(([name, _]) => 
        name.toLowerCase().includes(countryName.toLowerCase()) || 
        countryName.toLowerCase().includes(name.toLowerCase())
      );
      
      if (closeMatch) {
        code = closeMatch[1];
      }
    }
    
    return code;
  }, [countryNameToCode]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo/logo.svg"
                alt="Tariff Map Logo"
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-1000 font-display">
                  US Tariff and Trade Lens
                </h1>
              </div>
            </div>

            {/* Buy Me a Coffee Button */}
            <a
              href="https://www.buymeacoffee.com/tariffmap"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <span className="hidden sm:inline">Buy me a coffee</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transform group-hover:rotate-12 transition-transform duration-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8h12v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z" />
                <path d="M6 8V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v3" />
                <path d="M9 16v-4" />
                <path d="M15 16v-4" />
                <path d="M12 16v-4" />
                <path d="M6 12h12" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-24">
          <div className="flex flex-col w-full">
            {/* Map Type Tabs */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setActiveMap('tariff')}
                className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
                  activeMap === 'tariff'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title='Shows average tariff rates the US imposes on each country, as of April 2025'
              >
                Tariff Map
              </button>
              <button
                onClick={() => setActiveMap('deficit')}
                className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
                  activeMap === 'deficit'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title='Shows if the US has a trade surplus or deficit with each country.'
              >
                Deficit Map
              </button>
            </div>
            
            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden -mt-1">
              {activeMap === 'tariff' ? (
                <UsTariffMapComponent onCountrySelect={setSelectedCountry} />
              ) : (
                <UsDeficitMap onCountrySelect={setSelectedCountry} />
              )}
            </div>

            {/* Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in mt-6">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedCountry ? `US Trade and Tariff Details With ${selectedCountry.name}` : 'US Global Trade Summary'}
                  </h2>
                  {selectedCountry && (
                    <button
                      onClick={() => setSelectedCountry(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {selectedCountry ? (
                  <CountryDetails
                    countryId={parseInt(selectedCountry.code)}
                    countryName={selectedCountry.name}
                    onClose={() => setSelectedCountry(null)}
                  />
                ) : (
                  <GlobalStats />
                )}
              </div>
            </section>
            
            {/* Bottom Ad - Horizontal Banner */}
            <div className="w-full flex justify-center my-4">
              <AdComponent 
                adSlot="bottom-banner" 
                adFormat="horizontal" 
                className="w-full max-w-[728px] h-[90px]"
              />
            </div>
          </div>
        </main>
      </ErrorBoundary>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <img
                  src="/logo/logo.svg"
                  alt="Tariff Map Logo"
                  className="h-6 w-6"
                />
                <span className="text-base font-semibold tracking-tight text-gray-900 font-display">
                  TariffMap<span className="text-gray-500">.live</span>
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Tracking global trade relationships and tariff impacts in real-time.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                © {new Date().getFullYear()} TariffMap.live. All rights reserved.
              </p>
            </div>
            <div className="md:text-right">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Data Sources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="https://wits.worldbank.org/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    World Bank WITS
                  </a>
                </li>
                <li>
                  <a 
                    href="https://data.worldbank.org/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    World Bank Data
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
