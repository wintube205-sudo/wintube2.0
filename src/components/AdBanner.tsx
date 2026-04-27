import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  scriptSrc?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  scriptSrc = 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adRef.current;
    if (!container) return;

    if (!container.hasChildNodes()) {
      // Create and append the script
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      
      script.onload = () => console.log('Ad script loaded successfully:', scriptSrc);
      script.onerror = () => console.error('Failed to load ad script. It might be blocked by an AdBlocker:', scriptSrc);

      container.appendChild(script);
    }
    
    return () => {
      // Optional cleanup if the component unmounts
      if (container) {
         container.innerHTML = '';
      }
    };
  }, [scriptSrc]);

  return (
    <div 
      className="w-full flex justify-center items-center py-2 my-2 relative" 
      ref={adRef}
      style={{ minHeight: '90px', background: 'transparent' }}
    >
      <span className="text-white/20 text-xs absolute pointer-events-none">مساحة إعلانية</span>
    </div>
  );
};
