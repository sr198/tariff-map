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
import AdComponent from '@/components/AdComponent';
import ComingSoon from '@/components/ComingSoon';

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

// Main component
export default function Home() {
  // Check if we should show the coming soon page
  const showComingSoon = process.env.NEXT_PUBLIC_DISABLE_COMING_SOON !== 'true';
  
  // If coming soon is enabled, show the coming soon page
  if (showComingSoon) {
    return <ComingSoon />;
  }
  
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
    // This function is intentionally left empty as it's just a placeholder
    // for future hover functionality
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
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <Tabs value={activeMap} onValueChange={(value: string) => setActiveMap(value as 'tariff' | 'deficit')}>
                <TabsList>
                  <TabsTrigger value="deficit">US Trade Deficit Map</TabsTrigger>
                  <TabsTrigger value="tariff">US Tariff Map</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="p-1">
                {activeMap === 'tariff' ? (
                  <div className="animate-slide-up">
                    <WorldMapComponent
                      data={countryData}
                      onCountryClick={handleCountrySelect}
                      onCountryHover={handleCountryHover}
                    />
                  </div>
                ) : (
                  <div className="animate-slide-up">
                    <TradeDeficitMapComponent
                      countryNameToCode={countryNameToCode}
                      countryCodeToName={countryCodeToName}
                      countryMappings={countryMappings}
                      onCountrySelect={handleCountrySelect}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Country Selection Dropdown - Only visible on mobile */}
            <div className="md:hidden">
              <CountryDropdown 
                onCountrySelect={(countryCode) => {
                  const countryName = countryCodeToName[countryCode];
                  if (countryName) {
                    handleCountrySelect(countryName);
                  }
                }}
              />
            </div>

            {/* Middle Ad - Rectangle */}
            {/* <div className="w-full flex justify-center my-4">
              <AdComponent 
                adSlot="middle-rectangle" 
                adFormat="rectangle" 
                className="w-[300px] h-[250px]"
              />
            </div> */}

            {/* Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
              <div className="p-6">
                {selectedCountry ? (
                  <CountryDetails
                    countryName={selectedCountry}
                    countryCode={getCountryCode(selectedCountry)}
                    onBack={() => setSelectedCountry(null)}
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
            <div>
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
