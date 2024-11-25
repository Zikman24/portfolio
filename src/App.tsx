import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { AssetsList } from './components/AssetsList';
import { CurrentPrices } from './components/CurrentPrices';
import { ThemeToggle } from './components/ThemeToggle';
import { calculatePortfolioStats } from './utils/calculations';
import { getStockPrices } from './utils/api';
import { availableStocks } from './data/stocks';
import type { Transaction, Portfolio } from './types';
import { LayoutDashboard, History, PlusCircle, BarChart3, LineChart } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'new' | 'assets' | 'prices'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [portfolio, setPortfolio] = useState<Portfolio>({
    assets: [],
    transactions: [],
    totalValue: 0,
    performance: 0
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Fetch prices periodically
  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = availableStocks.map(stock => stock.symbol);
      const prices = await getStockPrices(symbols);
      setCurrentPrices(prices);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Update portfolio when transactions or prices change
  useEffect(() => {
    const updatePortfolio = async () => {
      const stats = await calculatePortfolioStats(transactions, currentPrices);
      setPortfolio(stats);
    };
    updatePortfolio();
  }, [transactions, currentPrices]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleNewTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions((prev) => [...prev, newTransaction]);
    setActiveTab('transactions');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...updatedTransaction, id } : t))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">MonPortefeuille</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Tableau de Bord
                </button>
                <button
                  onClick={() => setActiveTab('assets')}
                  className={`${
                    activeTab === 'assets'
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Positions
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`${
                    activeTab === 'prices'
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <LineChart className="w-4 h-4 mr-2" />
                  Cours
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`${
                    activeTab === 'transactions'
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <History className="w-4 h-4 mr-2" />
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`${
                    activeTab === 'new'
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nouvelle Transaction
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <Dashboard portfolio={portfolio} />}
        {activeTab === 'assets' && <AssetsList assets={portfolio.assets} />}
        {activeTab === 'prices' && <CurrentPrices assets={portfolio.assets} prices={currentPrices} />}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTransaction}
            onUpdate={handleUpdateTransaction}
          />
        )}
        {activeTab === 'new' && <TransactionForm onSubmit={handleNewTransaction} />}
      </main>
    </div>
  );
}

export default App;