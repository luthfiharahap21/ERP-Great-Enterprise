import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { DashboardStats } from '../types';
import { TrendingUp, Package, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    monthlySales: 0,
    lowStockCount: 0,
  });
  const [recentSalesData, setRecentSalesData] = useState<any[]>([]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const loadData = () => {
    const products = StorageService.getProducts();
    const customers = StorageService.getCustomers();
    const sales = StorageService.getSales();

    const currentMonth = new Date().getMonth();
    const monthlySalesTotal = sales
      .filter(s => new Date(s.date).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const lowStock = products.filter(p => p.stock < 10).length;

    setStats({
      totalProducts: products.length,
      totalCustomers: customers.length,
      monthlySales: monthlySalesTotal,
      lowStockCount: lowStock,
    });

    // Prepare chart data (last 5 sales for simplicity or grouped by day)
    const chartData = sales.slice(-7).map((s, i) => ({
      name: `Sale #${i + 1}`,
      amount: s.totalAmount
    }));
    setRecentSalesData(chartData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const StatCard = ({ title, value, icon, color, subText }: any) => (
    <div className="bg-white dark:bg-brand-dark p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
          {subText && <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">{subText}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Overview</h2>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Sales"
          value={formatRupiah(stats.monthlySales)}
          icon={<TrendingUp size={24} className="text-green-600" />}
          color="bg-green-100 dark:bg-green-900/20"
          subText="Current month revenue"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package size={24} className="text-blue-600" />}
          color="bg-blue-100 dark:bg-blue-900/20"
          subText="Items in inventory"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users size={24} className="text-purple-600" />}
          color="bg-purple-100 dark:bg-purple-900/20"
          subText="Registered clients"
        />
        <StatCard
          title="Low Stock Alert"
          value={stats.lowStockCount}
          icon={<AlertTriangle size={24} className="text-orange-600" />}
          color="bg-orange-100 dark:bg-orange-900/20"
          subText="Products below 10 qty"
        />
      </div>

      <div className="bg-white dark:bg-brand-dark p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Recent Sales Performance</h3>
        <div className="h-80 w-full">
          {recentSalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1F1F1F', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatRupiah(value)}
                />
                <Bar dataKey="amount" fill="#2F80ED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-500">No sales data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};