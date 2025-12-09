import { Product, Customer, Sale } from '../types';

const KEYS = {
  PRODUCTS: 'ge_products',
  CUSTOMERS: 'ge_customers',
  SALES: 'ge_sales',
  THEME: 'ge_theme'
};

// Seed data converted to Rupiah (Approx 1 USD = 16,000 IDR)
const SEED_PRODUCTS: Product[] = [
  { id: '1', name: 'Laptop Pro X1', sku: 'LP-001', price: 19200000, stock: 15 },
  { id: '2', name: 'Wireless Mouse', sku: 'WM-002', price: 400000, stock: 50 },
  { id: '3', name: 'Mechanical Keyboard', sku: 'KB-003', price: 1360000, stock: 30 },
  { id: '4', name: 'HD Monitor 24"', sku: 'MN-004', price: 2400000, stock: 8 },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '08123456789', address: '123 Main St, Jakarta' },
  { id: '2', name: 'Jane Smith', email: 'jane@enterprise.co', phone: '08987654321', address: '456 Tech Park, Bandung' },
];

export const StorageService = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : SEED_CUSTOMERS;
  },

  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getSales: (): Sale[] => {
    const data = localStorage.getItem(KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },

  saveSales: (sales: Sale[]) => {
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  },

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
  },

  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(KEYS.THEME, theme);
  }
};