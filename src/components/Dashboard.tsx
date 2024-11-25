import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Portfolio } from '../types';

interface DashboardProps {
  portfolio: Portfolio;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export function Dashboard({ portfolio }: DashboardProps) {
  const pieData = portfolio.assets
    .filter(asset => asset.quantity * asset.currentPrice > 0) // Only show assets with positive value
    .map(asset => ({
      name: asset.name,
      value: asset.quantity * asset.currentPrice
    }));

  const performanceData = portfolio.transactions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), 'yyyy-MM', { locale: fr });
      const value = transaction.type === 'buy' 
        ? transaction.quantity * transaction.price 
        : -transaction.quantity * transaction.price;
      
      const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
      acc.push({ 
        date, 
        value: lastValue + value 
      });
      
      return acc;
    }, [] as { date: string; value: number }[]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Valeur Totale"
          value={new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
          }).format(portfolio.totalValue)}
          icon={<Wallet className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Performance Globale"
          value={`${portfolio.performance.toFixed(2)}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Nombre d'Actifs"
          value={portfolio.assets.length.toString()}
          icon={<PieChartIcon className="w-6 h-6 text-purple-500" />}
        />
        <StatCard
          title="Transactions"
          value={portfolio.transactions.length.toString()}
          icon={<Activity className="w-6 h-6 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Évolution du Portefeuille</h2>
          <div className="h-[300px]">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM yyyy', { locale: fr })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Répartition des Actifs</h2>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${
              trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend} vs. mois dernier
            </p>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}