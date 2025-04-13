'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CountryDetails from '@/components/CountryDetails';
import Link from 'next/link';
import GlobalStats from '@/components/GlobalStats';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { measureComponentRender } from '@/utils/performance';
import StorySlideshow from '@/components/StorySlideshow';
import { fetchCountries } from '@/services/tradeService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryDropdown from '@/components/CountryDropdown';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global']));
  const [countryNameToCode, setCountryNameToCode] = useState<Record<string, string>>({});
  const [countryCodeToName, setCountryCodeToName] = useState<Record<string, string>>({});
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  // Use intersection observer for the details section
  const [detailsRef, isDetailsVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

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

  // Memoize the section toggle handler
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Memoize the country selection handler
  const handleCountrySelect = useCallback((country: { name: string; code: string }) => {
    setSelectedCountry(country);
  }, []);

  // Memoize the country clear handler
  const clearSelectedCountry = useCallback(() => {
    setSelectedCountry(null);
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete('country');
      return newSet;
    });
  }, []);

  // Memoize the section visibility check
  const isSectionExpanded = useCallback((section: string) => {
    return expandedSections.has(section);
  }, [expandedSections]);

  // Memoize the scroll handler
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCountryHover = (countryName: string | null) => {
    // This function is intentionally left empty as it's just a placeholder
    // for future hover functionality
  };

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

  // Measure component render time
  const cleanup = measureComponentRender('Home');

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
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
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 font-display">
                  US Trade & Tariff Map
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-col space-y-6 w-full">
            {/* Top Ad - Horizontal Banner */}
            <div className="w-full flex justify-center my-4">
              <AdComponent 
                adSlot="top-banner" 
                adFormat="horizontal" 
                className="w-full max-w-[728px] h-[90px]"
              />
            </div>
            
            {/* Map Type Tabs */}
            <div className="flex justify-end space-x-2 mb-4">
              <button
                onClick={() => setActiveMap('tariff')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeMap === 'tariff'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Tariff Map
              </button>
              <button
                onClick={() => setActiveMap('deficit')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeMap === 'deficit'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Deficit Map
              </button>
            </div>
            
            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {activeMap === 'tariff' ? (
                <UsTariffMapComponent onCountrySelect={setSelectedCountry} />
              ) : (
                <UsDeficitMap onCountrySelect={setSelectedCountry} />
              )}
            </div>

            {/* Country Selection Dropdown - Only visible on mobile */}
            <div className="md:hidden">
              <CountryDropdown 
                onCountrySelect={(countryCode) => {
                  const countryName = countryCodeToName[countryCode];
                  if (countryName) {
                    handleCountrySelect({ name: countryName, code: countryNameToCode[countryName] });
                  }
                }}
              />
            </div>

            {/* Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedCountry ? `US Trade and Tariff Details With ${selectedCountry.name}` : 'Global Trade Overview'}
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
      <footer className="bg-white border-t border-gray-100 mt-auto">
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
          
          {/* Footer Ad - Horizontal Banner */}
          <div className="w-full flex justify-center mt-8">
            <AdComponent 
              adSlot="footer-banner" 
              adFormat="horizontal" 
              className="w-full max-w-[728px] h-[90px]"
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} TariffMap.live. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
