import React, { useState, useEffect } from 'react';
import { availableStocks } from '../data/stocks';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import type { Asset } from '../types';

interface CurrentPricesProps {
  assets: Asset[];
  prices: Record<string, number>;
}

export function CurrentPrices({ assets, prices }: CurrentPricesProps) {
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setPreviousPrices(prices);
  }, [prices]);

  // Filtrer les stocks disponibles pour ne garder que ceux présents dans le portefeuille
  const portfolioStocks = availableStocks.filter(stock => 
    assets.some(asset => asset.name === stock.name)
  );

  const filteredStocks = portfolioStocks.filter(stock => {
    const normalizedSearch = searchTerm.toLowerCase();
    return stock.name.toLowerCase().includes(normalizedSearch) ||
           stock.symbol.toLowerCase().includes(normalizedSearch);
  });

  const getStockCategory = (symbol: string) => {
    if (symbol.includes('-EUR')) return 'Crypto';
    if (symbol.endsWith('.PA')) return 'Euronext Paris';
    if (symbol.endsWith('.AS')) return 'Euronext Amsterdam';
    if (symbol.endsWith('.DE')) return 'Deutsche Börse';
    return 'US Market';
  };

  const groupedStocks = filteredStocks.reduce((acc, stock) => {
    const category = getStockCategory(stock.symbol);
    if (!acc[category]) acc[category] = [];
    acc[category].push(stock);
    return acc;
  }, {} as Record<string, typeof availableStocks>);

  const getPriceChange = (symbol: string) => {
    const current = prices[symbol];
    const previous = previousPrices[symbol];
    if (!current || !previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getAssetQuantity = (stockName: string) => {
    const asset = assets.find(a => a.name === stockName);
    return asset ? asset.quantity : 0;
  };

  const getAssetValue = (stockName: string, currentPrice: number) => {
    const quantity = getAssetQuantity(stockName);
    return quantity * currentPrice;
  };

  if (portfolioStocks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Aucun actif dans votre portefeuille
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cours de Vos Actifs
          </h2>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un actif..."
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        {Object.entries(groupedStocks).map(([category, stocks]) => (
          <div key={category}>
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {category}
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Symbole
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valeur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stocks.map((stock) => {
                  const price = prices[stock.symbol];
                  const change = getPriceChange(stock.symbol);
                  const isPositive = change >= 0;
                  const quantity = getAssetQuantity(stock.name);
                  const value = getAssetValue(stock.name, price);

                  return (
                    <tr key={stock.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {stock.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stock.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {quantity.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {price ? new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex items-center ${
                          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {change ? `${change.toFixed(2)}%` : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}