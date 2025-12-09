import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Product, Sale } from '../types';
import { RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  
  const loadData = () => {
    const s = StorageService.getSales();
    const p = StorageService.getProducts();
    setSales(s);
    setProducts(p);

    // Process Revenue Data (Group by Date)
    const revenueMap: Record<string, number> = {};
    s.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString();
      revenueMap[date] = (revenueMap[date] || 0) + sale.totalAmount;
    });
    const revData = Object.keys(revenueMap).map(date => ({ date, amount: revenueMap[date] }));
    setRevenueData(revData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    // Process Stock Data (Top 5 items by value)
    const stockVal = p.map(prod => ({ name: prod.name, value: prod.stock * prod.price }));
    setStockData(stockVal.sort((a,b) => b.value - a.value).slice(0, 5));
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const totalRevenue = sales.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalPending = sales.filter(s => s.status === 'PENDING').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const inventoryValue = products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);

  const COLORS = ['#2F80ED', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Business Reports</h2>
        <button onClick={loadData} className="p-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"><RefreshCw size={20} /></button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-brand-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Total Revenue (Paid)</p>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{formatRupiah(totalRevenue)}</h3>
        </div>
        <div className="bg-white dark:bg-brand-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Pending Payments</p>
          <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{formatRupiah(totalPending)}</h3>
        </div>
        <div className="bg-white dark:bg-brand-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Inventory Value</p>
          <h3 className="text-2xl font-bold text-brand-blue mt-2">{formatRupiah(inventoryValue)}</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-brand-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 h-96">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-6">Sales Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2F80ED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F1F1F', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => formatRupiah(value)}
              />
              <Area type="monotone" dataKey="amount" stroke="#2F80ED" fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Value Dist */}
        <div className="bg-white dark:bg-brand-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 h-96">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-6">Top 5 Inventory Assets (by Value)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 formatter={(value: number) => formatRupiah(value)}
                 contentStyle={{ backgroundColor: '#1F1F1F', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};