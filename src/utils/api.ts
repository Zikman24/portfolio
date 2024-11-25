import { availableStocks } from '../data/stocks';

const ALPHA_VANTAGE_API_KEY = 'demo';

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  // Recherche locale d'abord
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  
  const localResults = availableStocks
    .filter(stock => {
      const stockName = stock.name.toLowerCase();
      const stockSymbol = stock.symbol.toLowerCase();
      
      // Vérifie si tous les mots de la recherche sont présents dans le nom ou le symbole
      return words.every(word => 
        stockName.includes(word) || stockSymbol.includes(word)
      );
    })
    .map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.symbol.endsWith('.PA') ? 'Euronext Paris' : 
               stock.symbol.endsWith('.AS') ? 'Euronext Amsterdam' :
               stock.symbol.endsWith('.DE') ? 'Deutsche Börse' :
               stock.symbol.includes('-EUR') ? 'Crypto' : 'US Market',
      type: stock.symbol.includes('-EUR') ? 'CRYPTO' : 'EQUITY'
    }));

  // Si on a des résultats locaux, on les retourne immédiatement
  if (localResults.length > 0) {
    return localResults;
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.bestMatches) {
      return data.bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        exchange: match['4. region'],
        type: match['3. type']
      }));
    }

    return [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return localResults; // Fallback to local results on error
  }
}

export async function getStockPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return parseFloat(data['Global Quote']['05. price']);
    }
    
    throw new Error('Invalid price data');
  } catch (error) {
    console.warn(`Using mock data for ${symbol} due to API error:`, error);
    return getMockPrice(symbol);
  }
}

export async function getStockPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (const symbol of symbols) {
    try {
      prices[symbol] = await getStockPrice(symbol);
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Using mock data for ${symbol}:`, error);
      prices[symbol] = getMockPrice(symbol);
    }
  }
  
  return prices;
}

function getMockPrice(symbol: string): number {
  const basePrice = Math.abs(symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const variation = Math.sin(Date.now() / 10000) * 10;
  
  const mockPrices: Record<string, number> = {
    // Crypto
    'BTC-EUR': 35000 + variation * 100,
    'ETH-EUR': 2000 + variation * 10,
    'XRP-EUR': 0.5 + variation * 0.01,
    'SOL-EUR': 80 + variation,
    'ADA-EUR': 0.4 + variation * 0.01,
    'DOT-EUR': 6 + variation * 0.1,
    'MATIC-EUR': 0.8 + variation * 0.01,
    
    // US Tech
    'AAPL': 180 + variation,
    'MSFT': 350 + variation,
    'GOOGL': 140 + variation,
    'AMZN': 170 + variation,
    'META': 450 + variation,
    'NVDA': 780 + variation,
    'TSLA': 180 + variation,
    
    // CAC 40
    'AI.PA': 160 + variation,
    'MC.PA': 780 + variation,
    'OR.PA': 420 + variation,
    'ESE.PA': 174 + variation,
    'BNP.PA': 62 + variation,
    'SAN.PA': 87 + variation,
    
    // ETFs
    'CW8.PA': 420 + variation,
    '500.PA': 78 + variation,
    'EP500.PA': 15 + variation,
    'EWRD.PA': 280 + variation,
    'IWDA.AS': 75 + variation,
    'VWCE.DE': 98 + variation,
    'ESP0.PA': 42 + variation,
    'CSPX.AS': 460 + variation,
    'VUSA.AS': 82 + variation
  };

  return mockPrices[symbol] || (basePrice % 100) + 20 + variation;
}