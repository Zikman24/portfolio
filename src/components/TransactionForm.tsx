import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';
import { searchStocks, getStockPrice, type SearchResult } from '../utils/api';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  initialValues?: Transaction;
  submitLabel?: string;
}

export function TransactionForm({ onSubmit, initialValues, submitLabel = 'Ajouter la transaction' }: TransactionFormProps) {
  const [type, setType] = useState<'buy' | 'sell'>(initialValues?.type || 'buy');
  const [asset, setAsset] = useState(initialValues?.asset || '');
  const [quantity, setQuantity] = useState(initialValues?.quantity.toString() || '');
  const [price, setPrice] = useState(initialValues?.price.toString() || '');
  const [date, setDate] = useState<Date>(initialValues?.date || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Ferme le calendrier si on clique en dehors
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDatePicker && !(event.target as Element).closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length >= 2) {
      setIsSearching(true);
      setShowSuggestions(true);

      const timeout = setTimeout(async () => {
        try {
          const results = await searchStocks(query);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching stocks:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const selectStock = async (stock: SearchResult) => {
    setAsset(stock.name);
    setSearchTerm('');
    setShowSuggestions(false);
    
    try {
      const price = await getStockPrice(stock.symbol);
      if (price) {
        setPrice(price.toString());
        setCurrentPrice(price);
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: Omit<Transaction, 'id'> = {
      type,
      asset,
      quantity: Number(quantity),
      price: Number(price),
      date
    };

    onSubmit(transaction);

    if (!initialValues) {
      setType('buy');
      setAsset('');
      setQuantity('');
      setPrice('');
      setDate(new Date());
      setCurrentPrice(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type de transaction
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="type"
              value="buy"
              checked={type === 'buy'}
              onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Achat</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="type"
              value="sell"
              checked={type === 'sell'}
              onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Vente</span>
          </label>
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Actif
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Rechercher une action, ETF, crypto..."
          />
          {isSearching ? (
            <Loader2 className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {showSuggestions && (searchResults.length > 0 || isSearching) && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
            {isSearching ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                Recherche en cours...
              </div>
            ) : (
              searchResults.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => selectStock(stock)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {stock.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {stock.symbol} • {stock.exchange}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {currentPrice && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Prix actuel: {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(currentPrice)}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Quantité
        </label>
        <input
          type="number"
          step="0.0001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prix unitaire (€)
        </label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <div className="relative date-picker-container">
          <input
            type="text"
            value={format(date, 'dd/MM/yyyy', { locale: fr })}
            onClick={() => setShowDatePicker(true)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
            readOnly
          />
          <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          
          {showDatePicker && (
            <div className="absolute z-20 mt-1">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                    setShowDatePicker(false);
                  }
                }}
                locale={fr}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full btn"
      >
        {submitLabel}
      </button>
    </form>
  );
}