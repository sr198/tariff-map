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

  useEffect(() => {
    // Wait for the AdSense script to load
    const checkAdSense = setInterval(() => {
      if (window.adsbygoogle) {
        clearInterval(checkAdSense);
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsAdLoaded(true);
        } catch (err) {
          console.error('Error loading AdSense ad:', err);
        }
      }
    }, 100);

    // Cleanup interval
    return () => clearInterval(checkAdSense);
  }, [adSlot]);

  return (
    <div className={`ad-container ${className}`} style={style}>
      {/* Google AdSense */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-8814239581528072"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
      
      {/* Loading placeholder */}
      {!isAdLoaded && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading ad...</div>
        </div>
      )}
    </div>
  );
};

export default AdComponent; 