'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CountryDetails from '@/components/CountryDetails';
import Link from 'next/link';
import WorldMap from '@/components/WorldMap';
import GlobalStats from '@/components/GlobalStats';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { measureComponentRender } from '@/utils/performance';
import StorySlideshow from '@/components/StorySlideshow';
import { fetchCountries, fetchCountryMappings } from '@/services/tradeService';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryDropdown from '@/components/CountryDropdown';

// Dynamically import the map components to avoid SSR issues
const WorldMapComponent = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[21/9] bg-gray-100 flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

const TradeDeficitMapComponent = dynamic(() => import('@/components/TradeDeficitMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[21/9] bg-gray-100 flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

export default function Home() {
  const [activeSection, setActiveSection] = useState('map');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global']));
  const [countryNameToCode, setCountryNameToCode] = useState<Record<string, string>>({});
  const [countryCodeToName, setCountryCodeToName] = useState<Record<string, string>>({});
  const [countryMappings, setCountryMappings] = useState<Record<string, string>>({});
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [activeMap, setActiveMap] = useState<'tariff' | 'deficit'>('deficit');

  // Use intersection observer for the details section
  const [detailsRef, isDetailsVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

  // Fetch countries and mappings from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingCountries(true);
        
        // Fetch countries and mappings in parallel
        const [countries, mappings] = await Promise.all([
          fetchCountries(),
          fetchCountryMappings()
        ]);
        
        // Create mappings of country names to ISO codes and vice versa
        const nameToCode: Record<string, string> = {};
        const codeToName: Record<string, string> = {};
        
        countries.forEach(country => {
          nameToCode[country.name] = country.iso_alpha3;
          codeToName[country.iso_alpha3] = country.name;
        });
        
        setCountryNameToCode(nameToCode);
        setCountryCodeToName(codeToName);
        setCountryMappings(mappings);
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
  const handleCountrySelect = useCallback((countryNameOrCode: string, countryName?: string) => {
    console.log('Country selected:', countryNameOrCode, countryName);
    
    // If countryName is provided, it means we're getting a country code and name from TradeDeficitMap
    // Otherwise, we're getting just a country name from WorldMap
    if (countryName) {
      setSelectedCountry(countryName);
    } else {
      setSelectedCountry(countryNameOrCode);
    }
    
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.add('country');
      return newSet;
    });
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
    console.log('Country hover:', countryName);
  };

  // Get the country code for the selected country
  const getCountryCode = useCallback((countryName: string): string | undefined => {
    // First try to get the code directly
    let code = countryNameToCode[countryName];
    
    // If not found, try to find a close match
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

  // Memoize the country data for the map
  const countryData = useMemo(() => {
    // Create a mapping of country names to their ISO codes
    const data: Record<string, string> = {};
    
    Object.entries(countryNameToCode).forEach(([name, code]) => {
      data[name] = code;
    });
    
    return data;
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
      <header className="bg-[#0A1A2F] shadow-md">
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
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">US Trade & Tariff Map</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="flex flex-col space-y-6 w-full">
            <div className="mb-6">
              <Tabs value={activeMap} onValueChange={(value: string) => setActiveMap(value as 'tariff' | 'deficit')}>
                <TabsList>
                  <TabsTrigger value="deficit">Trade Deficit Map</TabsTrigger>
                  <TabsTrigger value="tariff">Tariff Map</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Country Selection Dropdown - Only visible on mobile */}
            <div className="mb-6 md:hidden">
              <CountryDropdown 
                onCountrySelect={(countryCode) => {
                  const countryName = countryCodeToName[countryCode];
                  if (countryName) {
                    handleCountrySelect(countryName);
                  }
                }}
              />
            </div>

            <div className="mb-6">
              {activeMap === 'tariff' ? (
                <WorldMapComponent
                  data={countryData}
                  onCountryClick={handleCountrySelect}
                  onCountryHover={handleCountryHover}
                />
              ) : (
                <TradeDeficitMapComponent
                  countryNameToCode={countryNameToCode}
                  countryCodeToName={countryCodeToName}
                  countryMappings={countryMappings}
                  onCountrySelect={handleCountrySelect}
                />
              )}
            </div>

            {/* Details Section */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              {selectedCountry ? (
                <CountryDetails
                  countryName={selectedCountry}
                  countryCode={getCountryCode(selectedCountry)}
                  onBack={() => setSelectedCountry(null)}
                />
              ) : (
                <GlobalStats />
              )}
            </section>
          </div>
        </main>
      </ErrorBoundary>

      {/* Footer */}
      <footer className="bg-[#0A1A2F] text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/logo/logo.svg"
                  alt="Tariff Map Logo"
                  className="h-6 w-6"
                />
                <span className="text-lg font-bold text-white">
                  TariffMap<span className="text-blue-300">.live</span>
                </span>
              </div>
              <p className="text-sm">
                Tracking global trade relationships and tariff impacts in real-time.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Data Sources</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <a 
                    href="https://wits.worldbank.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-400 transition-colors"
                  >
                    World Bank - World Integrated Trade Solution
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.whitehouse.gov/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-400 transition-colors"
                  >
                    The White House
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
