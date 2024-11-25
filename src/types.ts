export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  quantity: number;
  price: number;
  date: Date;
}

export interface Asset {
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

export interface Portfolio {
  assets: Asset[];
  transactions: Transaction[];
  totalValue: number;
  performance: number;
}