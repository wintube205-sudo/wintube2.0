import React, { useEffect, useRef } from 'react';

export const AdBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We append the script inside the component to ensure it runs
    // and correctly targets the div that is rendered right here.
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl29250735.profitablecpmratenetwork.com/2da6c41b1bfa88a88a7943f40aec23f4/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-2 my-2 relative overflow-hidden">
      <div ref={containerRef} className="w-full max-w-[728px] mx-auto flex justify-center">
        <div id="container-2da6c41b1bfa88a88a7943f40aec23f4"></div>
      </div>
    </div>
  );
};
