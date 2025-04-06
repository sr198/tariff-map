'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import CountryDetails from '@/components/CountryDetails';
import Link from 'next/link';
import WorldMap from '@/components/WorldMap';
import GlobalStats from '@/components/GlobalStats';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { measureComponentRender } from '@/utils/performance';
import StorySlideshow from '@/components/StorySlideshow';

// Dynamically import the WorldMap component to avoid SSR issues
const WorldMapComponent = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[21/9] bg-gray-100 flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

interface CountryData {
  usImportTariff: number;
  countryExportTariff: number;
  tradeBalance: number;
}

interface CountryDataMap {
  [key: string]: CountryData;
}

// Temporary mock data - replace with API data
const mockData: Record<string, CountryData> = {
  'China': {
    usImportTariff: 25.0,
    countryExportTariff: 20.0,
    tradeBalance: -419.2e9,
  },
  'Germany': {
    usImportTariff: 15.0,
    countryExportTariff: 12.5,
    tradeBalance: -78.3e9,
  },
  'France': {
    usImportTariff: 18.0,
    countryExportTariff: 15.0,
    tradeBalance: -45.2e9,
  },
  'United Kingdom': {
    usImportTariff: 12.0,
    countryExportTariff: 10.0,
    tradeBalance: -25.1e9,
  },
  // Add more countries as needed
};

export default function Home() {
  const [activeSection, setActiveSection] = useState('map');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['global']));

  // Use intersection observer for the details section
  const [detailsRef, isDetailsVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

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
  const handleCountrySelect = useCallback((countryName: string) => {
    setSelectedCountry(countryName);
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

  // Measure component render time
  const cleanup = measureComponentRender('Home');

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0A1A2F] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <svg
                className="h-8 w-8 text-blue-300"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 2L4 8v16l12 6 12-6V8L16 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 2v12m0 16V14m12-6L16 14 4 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">US Trade & Tariff Map</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ErrorBoundary>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full overflow-hidden">
            <div className="flex flex-col space-y-6">
              {/* Map Section */}
              <section className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-base md:text-lg font-semibold text-gray-900">Interactive World Map</span>
                  </div>
                </div>
                <div className="p-4">
                  <WorldMapComponent
                    onCountryHover={handleCountryHover}
                    onCountryClick={handleCountrySelect}
                    data={mockData}
                  />
                </div>
              </section>

              {/* Details Section */}
              <section className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[600px]">
                <div className="h-full">
                  {selectedCountry && mockData[selectedCountry] ? (
                    <CountryDetails
                      countryName={selectedCountry}
                      data={mockData[selectedCountry]}
                      onBack={() => setSelectedCountry(null)}
                    />
                  ) : (
                    <GlobalStats data={mockData} />
                  )}
                </div>
              </section>

              {/* New Tariff Explainer Section */}
              <section className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Wait, how does tariff work again?
                    </h2>
                  </div>
                </div>
                <StorySlideshow />
              </section>
            </div>
          </div>
        </main>
      </ErrorBoundary>

      {/* Footer */}
      <footer className="bg-[#0A1A2F] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  className="h-6 w-6 text-blue-300"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 2L4 8v16l12 6 12-6V8L16 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 2v12m0 16V14m12-6L16 14 4 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-lg font-bold text-white">
                  TariffMap<span className="text-blue-300">.live</span>
                </span>
              </div>
              <p className="text-sm">
                Tracking global trade relationships and tariff impacts in real-time.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
