import { Transaction, Asset, Portfolio } from '../types';
import { availableStocks } from '../data/stocks';

export async function calculatePortfolioStats(
  transactions: Transaction[],
  currentPrices: Record<string, number>
): Promise<Portfolio> {
  const assets = new Map<string, Asset>();
  
  // Calculate positions for each asset
  transactions.forEach(transaction => {
    const existing = assets.get(transaction.asset) || {
      name: transaction.asset,
      quantity: 0,
      averagePrice: 0,
      currentPrice: 0,
    };

    if (transaction.type === 'buy') {
      const newQuantity = existing.quantity + transaction.quantity;
      const newTotalCost = (existing.quantity * existing.averagePrice) + (transaction.quantity * transaction.price);
      existing.averagePrice = newTotalCost / newQuantity;
      existing.quantity = newQuantity;
    } else {
      existing.quantity -= transaction.quantity;
    }

    if (existing.quantity > 0) {
      assets.set(transaction.asset, existing);
    } else {
      assets.delete(transaction.asset);
    }
  });

  // Update current prices
  const assetsList = Array.from(assets.values());
  assetsList.forEach(asset => {
    const stock = availableStocks.find(s => s.name === asset.name);
    if (stock && currentPrices[stock.symbol]) {
      asset.currentPrice = currentPrices[stock.symbol];
    }
  });

  const totalValue = assetsList.reduce((sum, asset) => 
    sum + (asset.quantity * asset.currentPrice), 0);
  
  const totalCost = assetsList.reduce((sum, asset) => 
    sum + (asset.quantity * asset.averagePrice), 0);
  
  const performance = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  
  return {
    assets: assetsList,
    transactions,
    totalValue,
    performance
  };
}