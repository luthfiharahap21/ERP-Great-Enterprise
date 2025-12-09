import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Customer, Product, Sale, SaleItem } from '../types';
import { Plus, Trash2, Edit, Save, RefreshCw, X, ShoppingCart } from 'lucide-react';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cartItems, setCartItems] = useState<{product: Product, qty: number}[]>([]);

  // Edit Sale Form State
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    date: '',
    customerId: '',
    totalAmount: 0,
    status: 'PENDING' as 'PENDING' | 'PAID'
  });
  
  const loadData = () => {
    setSales(StorageService.getSales().reverse()); // Newest first
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  // --- CREATE LOGIC ---

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if already in cart
    const existing = cartItems.find(item => item.product.id === productId);
    if (existing) {
       if (existing.qty < product.stock) {
           setCartItems(cartItems.map(item => item.product.id === productId ? {...item, qty: item.qty + 1} : item));
       } else {
           alert("Not enough stock!");
       }
    } else {
        if (product.stock > 0) {
            setCartItems([...cartItems, { product, qty: 1 }]);
        } else {
            alert("Out of stock!");
        }
    }
  };

  const updateQty = (idx: number, newQty: number) => {
      const item = cartItems[idx];
      if (newQty > item.product.stock) {
          alert(`Only ${item.product.stock} available`);
          return;
      }
      if (newQty < 1) return;
      
      const newCart = [...cartItems];
      newCart[idx].qty = newQty;
      setCartItems(newCart);
  };

  const removeCartItem = (idx: number) => {
      setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const calculateTotal = () => {
      return cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  };

  const handleCheckout = () => {
      if (!selectedCustomerId) {
          alert("Please select a customer");
          return;
      }
      if (cartItems.length === 0) {
          alert("Cart is empty");
          return;
      }

      const customer = customers.find(c => c.id === selectedCustomerId)!;
      
      const saleItems: SaleItem[] = cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.qty,
          priceAtSale: item.product.price,
          total: item.product.price * item.qty
      }));

      const newSale: Sale = {
          id: Date.now().toString(),
          customerId: customer.id,
          customerName: customer.name,
          date: new Date().toISOString(),
          items: saleItems,
          totalAmount: calculateTotal(),
          status: 'PENDING'
      };

      // 1. Save Sale
      const updatedSales = [...sales, newSale];
      StorageService.saveSales(updatedSales);

      // 2. Update Inventory
      const updatedProducts = products.map(p => {
          const cartItem = cartItems.find(i => i.product.id === p.id);
          if (cartItem) {
              return { ...p, stock: p.stock - cartItem.qty };
          }
          return p;
      });
      StorageService.saveProducts(updatedProducts);

      // Reset
      setIsCreating(false);
      setCartItems([]);
      setSelectedCustomerId('');
      loadData(); // Reload all to reflect stock changes
  };

  const toggleStatus = (sale: Sale) => {
      const updatedSales = sales.map(s => 
          s.id === sale.id 
            ? { ...s, status: s.status === 'PENDING' ? 'PAID' as const : 'PENDING' as const } 
            : s
      );
      setSales(updatedSales);
      StorageService.saveSales(updatedSales);
  };

  // --- EDIT LOGIC ---

  const openEditModal = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setEditFormData({
      id: sale.id,
      date: new Date(sale.date).toISOString().split('T')[0], // Format for input type=date
      customerId: sale.customerId,
      totalAmount: sale.totalAmount,
      status: sale.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSaleId) return;

    const customer = customers.find(c => c.id === editFormData.customerId);
    if (!customer) {
        alert("Invalid customer");
        return;
    }

    const updatedSales = sales.map(s => {
      if (s.id === editingSaleId) {
        return {
          ...s,
          id: editFormData.id, // Allow ID change
          date: new Date(editFormData.date).toISOString(),
          customerId: customer.id,
          customerName: customer.name,
          totalAmount: Number(editFormData.totalAmount),
          status: editFormData.status
        };
      }
      return s;
    });

    StorageService.saveSales(updatedSales);
    setSales(updatedSales);
    setIsEditModalOpen(false);
    setEditingSaleId(null);
  };

  const handleDeleteSale = () => {
    if (!editingSaleId) return;
    if (confirm("Are you sure you want to delete this invoice? This action cannot be undone and will NOT revert stock changes.")) {
        const updatedSales = sales.filter(s => s.id !== editingSaleId);
        StorageService.saveSales(updatedSales);
        setSales(updatedSales);
        setIsEditModalOpen(false);
        setEditingSaleId(null);
    }
  };

  // --- RENDER ---

  if (isCreating) {
      return (
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Invoice</h2>
                  <button onClick={() => setIsCreating(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">Cancel</button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Product Selection */}
                  <div className="lg:col-span-2 bg-white dark:bg-brand-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Select Products</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                          {products.map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => handleAddToCart(p.id)}
                                disabled={p.stock === 0}
                                className={`p-4 rounded-lg border text-left transition-all ${p.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : 'hover:border-brand-blue border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}
                              >
                                  <div className="font-medium text-gray-800 dark:text-white">{p.name}</div>
                                  <div className="flex justify-between mt-2 text-sm">
                                      <span className="text-brand-blue font-bold">{formatRupiah(p.price)}</span>
                                      <span className="text-gray-500">{p.stock} in stock</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Right: Cart Summary */}
                  <div className="bg-white dark:bg-brand-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-full">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Order Summary</h3>
                      
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Customer</label>
                          <select 
                            value={selectedCustomerId} 
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
                          >
                              <option value="">Select a customer...</option>
                              {customers.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          {cartItems.length === 0 && <p className="text-gray-400 text-center text-sm py-4">Cart is empty</p>}
                          {cartItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex-1">
                                      <div className="text-gray-800 dark:text-white truncate">{item.product.name}</div>
                                      <div className="text-gray-500">{formatRupiah(item.product.price)} x {item.qty}</div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <input 
                                        type="number" 
                                        min="1" 
                                        value={item.qty} 
                                        onChange={(e) => updateQty(idx, parseInt(e.target.value))}
                                        className="w-12 p-1 text-center border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                      />
                                      <button onClick={() => removeCartItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                          <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white mb-4">
                              <span>Total</span>
                              <span>{formatRupiah(calculateTotal())}</span>
                          </div>
                          <button 
                            onClick={handleCheckout}
                            className="w-full py-3 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                          >
                              Save Sale
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sales & Invoices</h2>
        <div className="flex gap-2">
            <button onClick={loadData} className="p-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"><RefreshCw size={20} /></button>
            <button onClick={() => setIsCreating(true)} className="flex items-center space-x-2 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg transition-colors"><Plus size={20} /><span>New Invoice</span></button>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                          <th className="pb-3 pl-2">Date</th>
                          <th className="pb-3">Invoice #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sales.map(sale => (
                          <tr key={sale.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-3 pl-2 text-gray-600 dark:text-gray-400 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                              <td className="py-3 text-gray-800 dark:text-gray-200 font-mono text-sm">{sale.id.slice(-6)}</td>
                              <td className="py-3 text-gray-800 dark:text-gray-200">{sale.customerName}</td>
                              <td className="py-3 font-bold text-brand-blue">{formatRupiah(sale.totalAmount)}</td>
                              <td className="py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                      {sale.status}
                                  </span>
                              </td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex justify-end items-center space-x-2">
                                  <button
                                     onClick={() => openEditModal(sale)}
                                     className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                     title="Edit Invoice"
                                  >
                                      <Edit size={16} />
                                  </button>
                                  {sale.status === 'PENDING' && (
                                      <button 
                                        onClick={() => toggleStatus(sale)} 
                                        className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 px-3 py-1 rounded-md transition-colors whitespace-nowrap"
                                      >
                                          Mark Paid
                                      </button>
                                  )}
                                </div>
                              </td>
                          </tr>
                      ))}
                      {sales.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No sales record found.</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Edit Invoice
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSale} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice ID</label>
                   <input required type="text" value={editFormData.id} onChange={e => setEditFormData({...editFormData, id: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                   <input required type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                    <select 
                      value={editFormData.customerId} 
                      onChange={(e) => setEditFormData({...editFormData, customerId: e.target.value})}
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
                    >
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount (Rp) - <span className="text-xs text-gray-500">Override manual</span></label>
                   <input required type="number" step="500" value={editFormData.totalAmount} onChange={e => setEditFormData({...editFormData, totalAmount: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select 
                      value={editFormData.status} 
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value as 'PENDING' | 'PAID'})}
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none"
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                    </select>
                </div>

                <div className="pt-6 flex justify-between gap-4">
                    <button type="button" onClick={handleDeleteSale} className="flex items-center space-x-2 px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 transition-colors">
                        <Trash2 size={18} />
                        <span>Delete Invoice</span>
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                        <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 font-medium">
                            <Save size={18} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};