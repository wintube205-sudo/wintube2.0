import React from 'react';

export const AdBanner: React.FC = () => {
  return (
    <div className="w-full flex justify-center items-center py-2 my-2 relative">
      <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
        <iframe 
          data-aa='2436111' 
          src='//acceptable.a-ads.com/2436111/?size=Adaptive'
          style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
          title="a-ads"
        ></iframe>
      </div>
    </div>
  );
};
