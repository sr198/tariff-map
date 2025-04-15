import React, { useEffect, useState } from 'react';

interface AdComponentProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({ 
  adSlot, 
  adFormat = 'auto',
  style = {},
  className = ''
}) => {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let checkAdSense: NodeJS.Timeout;

    const loadAd = () => {
      try {
        if (window.adsbygoogle) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsAdLoaded(true);
          setError(null);
        } else {
          checkAdSense = setTimeout(loadAd, 100);
        }
      } catch (err) {
        console.error('Error loading AdSense ad:', err);
        setError('Failed to load ad');
        setIsAdLoaded(false);
      }
    };

    // Initial check
    loadAd();

    // Cleanup
    return () => {
      if (checkAdSense) {
        clearTimeout(checkAdSense);
      }
    };
  }, [adSlot]);

  // Get proper ad format based on the prop
  const getAdFormat = () => {
    switch (adFormat) {
      case 'horizontal':
        return 'auto';
      case 'vertical':
        return 'vertical';
      case 'rectangle':
        return 'rectangle';
      case 'fluid':
        return 'fluid';
      default:
        return 'auto';
    }
  };

  return (
    <div className={`ad-container ${className}`} style={style}>
      {/* Google AdSense */}
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          minHeight: adFormat === 'horizontal' ? '90px' : '250px',
          ...style 
        }}
        data-ad-client="ca-pub-8977505484424540"
        data-ad-slot={adSlot}
        data-ad-format={getAdFormat()}
        data-full-width-responsive="true"
      />
      
      {/* Loading placeholder */}
      {!isAdLoaded && !error && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading ad...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
};

export default AdComponent; 