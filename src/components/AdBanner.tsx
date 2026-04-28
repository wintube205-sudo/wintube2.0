import React, { useEffect, useRef, useState } from 'react';
import { getBestAdNetwork } from '../services/AdsService';

interface AdBannerProps {
  scriptSrc?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ scriptSrc }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(scriptSrc || null);

  useEffect(() => {
    if (!scriptSrc) {
       getBestAdNetwork('banner').then(src => {
          setResolvedSrc(src);
       });
    }
  }, [scriptSrc]);

  useEffect(() => {
    const container = adRef.current;
    if (!container || !resolvedSrc) return;

    // Check if script already exists to prevent duplicate injection
    if (!container.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = resolvedSrc;
      script.async = true;
      
      script.onload = () => console.log('Ad script loaded successfully:', resolvedSrc);
      script.onerror = () => console.log('Ad script was blocked or failed to load.');

      container.appendChild(script);
    }
    
    return () => {
      if (container) {
         container.innerHTML = '';
      }
    };
  }, [resolvedSrc]);

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
