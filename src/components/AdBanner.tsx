import React, { useEffect, useRef } from 'react';

export const AdBanner = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We only want to inject the ad script once when the component mounts
    if (adRef.current && !adRef.current.hasChildNodes()) {
      const ins = document.createElement('ins');
      ins.style.width = '0px';
      ins.style.height = '0px';
      ins.setAttribute('data-width', '0');
      ins.setAttribute('data-height', '0');
      ins.className = 'u51cfc85ccc';
      ins.setAttribute('data-domain', '//data527.click');
      ins.setAttribute('data-affquery', '/0c6dbe12baa19be1f02b/51cfc85ccc/?placementName=default');
      
      const script = document.createElement('script');
      script.src = '//data527.click/js/responsive.js';
      script.async = true;
      
      ins.appendChild(script);
      adRef.current.appendChild(ins);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-4 min-h-[60px]" ref={adRef}>
    </div>
  );
};
