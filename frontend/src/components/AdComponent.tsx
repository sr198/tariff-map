import React, { useEffect } from 'react';

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
  useEffect(() => {
    // Load Google AdSense
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Error loading AdSense ad:', err);
    }
  }, [adSlot]);

  return (
    <div className={`ad-container ${className}`} style={style}>
      {/* Google AdSense */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="YOUR_ADSENSE_CLIENT_ID"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
      
      {/* Media.net */}
      <div id={adSlot} className="media-net-ad"></div>
    </div>
  );
};

export default AdComponent; 