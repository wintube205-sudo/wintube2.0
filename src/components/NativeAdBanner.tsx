import React, { useEffect } from 'react';

export const NativeAdBanner: React.FC = () => {
  useEffect(() => {
    if (!document.getElementById('native-invoke-script')) {
      const script = document.createElement('script');
      script.src = "https://pl29250735.profitablecpmratenetwork.com/2da6c41b1bfa88a88a7943f40aec23f4/invoke.js";
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = 'native-invoke-script';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-2 my-2 relative" style={{ minHeight: '90px' }}>
      <div id="container-2da6c41b1bfa88a88a7943f40aec23f4" className="z-10"></div>
      <span className="text-white/20 text-xs absolute pointer-events-none z-0">مساحة إعلانية</span>
    </div>
  );
};
