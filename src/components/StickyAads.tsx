import React, { useState } from 'react';

export const StickyAads: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999, pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: 'auto', textAlign: 'center', fontSize: 0, position: 'relative', pointerEvents: 'auto' }}>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            top: '50%', 
            transform: 'translateY(-50%)', 
            right: '12px', 
            position: 'absolute', 
            borderRadius: '4px', 
            background: 'rgba(248, 248, 249, 0.7)', 
            padding: '4px', 
            zIndex: 99999, 
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
            <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 "/>
          </svg>
        </button>
        <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
          <iframe 
            data-aa="2436271" 
            src="//acceptable.a-ads.com/2436271/?size=Adaptive" 
            style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', margin: 'auto', display: 'block' }}
            title="a-ads-sticky"
          ></iframe>
        </div>
      </div>
    </div>
  );
};
