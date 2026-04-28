export const AD_NETWORKS = {
  // Saudi Arabia
  SA: [
     { name: 'Adsterra', weight: 40, scriptSrc: 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' },
     { name: 'MenaAds', weight: 60, scriptSrc: 'https://pl29081721.profitablecpmratenetwork.com/af/01/2e/af012e0f5d549f7fbca9c56cc47808c8.js' }
  ],
  // Egypt
  EG: [
     { name: 'Adsterra', weight: 80, scriptSrc: 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' },
     { name: 'PopAds', weight: 20, scriptSrc: 'https://pl29081721.profitablecpmratenetwork.com/af/01/2e/af012e0f5d549f7fbca9c56cc47808c8.js' }
  ],
  // Iraq
  IQ: [
    { name: 'Adsterra', weight: 50, scriptSrc: 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' },
    { name: 'Monetag', weight: 50, scriptSrc: 'https://pl29081721.profitablecpmratenetwork.com/af/01/2e/af012e0f5d549f7fbca9c56cc47808c8.js' }
  ],
  // US and Tier 1
  US: [
     { name: 'Premium CPM', weight: 90, scriptSrc: 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' },
     { name: 'Adsterra', weight: 10, scriptSrc: 'https://pl29081721.profitablecpmratenetwork.com/af/01/2e/af012e0f5d549f7fbca9c56cc47808c8.js' }
  ],
  DEFAULT: [
     { name: 'ProfitableCPM', weight: 50, scriptSrc: 'https://pl29235932.profitablecpmratenetwork.com/95/8f/dd/958fddeaf0b4bc263a15d20890db89a6.js' },
     { name: 'ProfitableCPM2', weight: 50, scriptSrc: 'https://pl29081721.profitablecpmratenetwork.com/af/01/2e/af012e0f5d549f7fbca9c56cc47808c8.js' }
  ]
};

let userCountryCode: string | null = null;
let countryFetchPromise: Promise<string> | null = null;

export async function getUserCountry() {
    if (userCountryCode) return userCountryCode;
    if (countryFetchPromise) return countryFetchPromise;
    countryFetchPromise = fetch('https://api.country.is/')
        .then(res => res.json())
        .then(data => {
            userCountryCode = data.country;
            return data.country;
        })
        .catch(e => {
            console.error('Geo IP failed', e);
            userCountryCode = 'UNKNOWN';
            return 'UNKNOWN';
        });
    return countryFetchPromise;
}

export async function getBestAdNetwork(adType: 'banner' | 'native' = 'banner') {
   const countryCode = await getUserCountry();
   
   // In a real scenario, you would have different lists for native vs banner
   const networks = AD_NETWORKS[countryCode as keyof typeof AD_NETWORKS] || AD_NETWORKS.DEFAULT;

   // Weighted random selection
   const totalWeight = networks.reduce((sum, net) => sum + net.weight, 0);
   let random = Math.random() * totalWeight;
   
   for (const net of networks) {
      if (random < net.weight) {
          return net.scriptSrc;
      }
      random -= net.weight;
   }
   
   return AD_NETWORKS.DEFAULT[0].scriptSrc;
}
