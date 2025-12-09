import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, RefreshCw, X } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({ name: '', sku: '', price: 0, stock: 0 });

  const loadProducts = () => {
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) || 
    p.sku.toLowerCase().includes(searchTerm)
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const newProducts = products.filter(p => p.id !== id);
      StorageService.saveProducts(newProducts);
      setProducts(newProducts);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', price: 0, stock: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    let updatedProducts = [...products];
    if (editingProduct) {
      updatedProducts = updatedProducts.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } as Product : p
      );
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name!,
        sku: formData.sku!,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };
      updatedProducts.push(newProduct);
    }

    StorageService.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h2>
        <div className="flex gap-2">
            <button
                onClick={loadProducts}
                className="p-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
                <RefreshCw size={20} />
            </button>
            <button
                onClick={() => openModal()}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
                <Plus size={20} />
                <span>Add Product</span>
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products by Name or SKU..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredProducts.map(product => (
                <tr key={product.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pl-2 text-gray-800 dark:text-gray-200 font-medium">{product.name}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">{product.sku}</td>
                  <td className="py-3 text-gray-800 dark:text-gray-200">{formatRupiah(product.price)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (Rp)</label>
                  <input required type="number" min="0" step="500" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 font-medium">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};