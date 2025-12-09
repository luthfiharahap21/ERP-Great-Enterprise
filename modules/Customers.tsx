import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Customer, Sale } from '../types';
import { Plus, Search, Edit2, Trash2, RefreshCw, X, History } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState<Partial<Customer>>({ name: '', email: '', phone: '', address: '' });

  const loadData = () => {
    setCustomers(StorageService.getCustomers());
    setSales(StorageService.getSales());
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedCustomers = [...customers];
    if (selectedCustomer && !isHistoryOpen) {
       // Edit mode
       updatedCustomers = updatedCustomers.map(c => 
         c.id === selectedCustomer.id ? { ...c, ...formData } as Customer : c
       );
    } else {
      // Add mode
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name!,
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || ''
      };
      updatedCustomers.push(newCustomer);
    }
    StorageService.saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setIsModalOpen(false);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setIsHistoryOpen(false);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setIsHistoryOpen(false);
    setIsModalOpen(true);
  };

  const openHistoryModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
    setIsModalOpen(true);
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) {
      const updated = customers.filter(c => c.id !== id);
      StorageService.saveCustomers(updated);
      setCustomers(updated);
    }
  };

  const customerHistory = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Customers</h2>
        <div className="flex gap-2">
            <button onClick={loadData} className="p-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"><RefreshCw size={20} /></button>
            <button onClick={openAddModal} className="flex items-center space-x-2 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg transition-colors"><Plus size={20} /><span>Add Customer</span></button>
        </div>
      </div>

      <div className="bg-white dark:bg-brand-dark p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                <th className="pb-3 pl-2">Name</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Address</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {customers.filter(c => c.name.toLowerCase().includes(searchTerm)).map(customer => (
                <tr key={customer.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 pl-2 text-gray-800 dark:text-gray-200 font-medium">{customer.name}</td>
                  <td className="py-3 text-sm">
                    <div className="text-gray-800 dark:text-gray-300">{customer.email}</div>
                    <div className="text-gray-500 dark:text-gray-500 text-xs">{customer.phone}</div>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">{customer.address}</td>
                  <td className="py-3 text-right pr-2">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openHistoryModal(customer)} title="View Transactions" className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"><History size={16} /></button>
                      <button onClick={() => openEditModal(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {isHistoryOpen ? `History: ${selectedCustomer?.name}` : (selectedCustomer ? 'Edit Customer' : 'Add Customer')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white"><X size={24} /></button>
            </div>

            {isHistoryOpen ? (
               <div className="p-6">
                 {customerHistory.length === 0 ? (
                   <p className="text-gray-500 text-center">No transaction history found.</p>
                 ) : (
                   <div className="space-y-4">
                     {customerHistory.map(sale => (
                       <div key={sale.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                         <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800 dark:text-white">Inv #{sale.id.slice(-6)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span>
                         </div>
                         <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{new Date(sale.date).toLocaleDateString()}</div>
                         <div className="text-sm text-brand-blue font-bold">{formatRupiah(sale.totalAmount)}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            ) : (
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <textarea rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 font-medium">Save</button>
                  </div>
                </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};