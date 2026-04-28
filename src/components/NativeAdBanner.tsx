import React, { useEffect, useState } from 'react';
import { getBestAdNetwork } from '../services/AdsService';

export const NativeAdBanner: React.FC = () => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    getBestAdNetwork('native').then(src => {
       // Since the native script often requires a specific container ID, we might need a mapping,
       // but for simplicity we will just inject the chosen network script globally or handle similar formats.
       // Ideally we use a Native ad snippet that works consistently. 
       setResolvedSrc("https://pl29250735.profitablecpmratenetwork.com/2da6c41b1bfa88a88a7943f40aec23f4/invoke.js");
    });
  }, []);

  useEffect(() => {
    if (resolvedSrc && !document.getElementById('native-invoke-script')) {
      const script = document.createElement('script');
      script.src = resolvedSrc;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = 'native-invoke-script';
      document.head.appendChild(script);
    }
  }, [resolvedSrc]);

  return (
    <div className="w-full flex justify-center items-center py-2 my-2 relative" style={{ minHeight: '90px' }}>
      <div id="container-2da6c41b1bfa88a88a7943f40aec23f4" className="z-10"></div>
      <span className="text-white/20 text-xs absolute pointer-events-none z-0">مساحة إعلانية</span>
    </div>
  );
};
