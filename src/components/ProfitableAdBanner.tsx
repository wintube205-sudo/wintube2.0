import React, { useEffect, useRef } from 'react';

export const ProfitableAdBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent multiple injections if useEffect fires twice (React Strict Mode)
    if (!bannerRef.current) return;
    
    // Check if script is already injected
    if (document.getElementById('cpm-ad-script')) return;

    const script = document.createElement('script');
    script.id = 'cpm-ad-script';
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl29250735.profitablecpmratenetwork.com/2da6c41b1bfa88a88a7943f40aec23f4/invoke.js';

    // Append script to document head or body instead of the div itself 
    // depending on how the ad network seeks the container
    document.body.appendChild(script);

    return () => {
      // Optional cleanup
      // const existingScript = document.getElementById('cpm-ad-script');
      // if (existingScript) existingScript.remove();
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-4 relative" ref={bannerRef}>
      <div id="container-2da6c41b1bfa88a88a7943f40aec23f4"></div>
    </div>
  );
};
