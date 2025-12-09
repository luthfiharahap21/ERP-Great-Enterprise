export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface SaleItem {
  productId: string;
  productName: string; // Snapshot in case product name changes
  quantity: number;
  priceAtSale: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO string
  items: SaleItem[];
  totalAmount: number;
  status: 'PENDING' | 'PAID';
}

export type ViewType = 'DASHBOARD' | 'INVENTORY' | 'CUSTOMERS' | 'SALES' | 'REPORTS';

export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  monthlySales: number;
  lowStockCount: number;
}