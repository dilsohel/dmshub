export type UserRole = 'owner' | 'admin' | 'manager' | 'accountant' | 'salesperson' | 'inventory_manager';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  ownerId: string;
  businessType: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  currency: string; // e.g. "৳" or "$"
  currencyCode?: string; // "BDT", "USD"
  invoicePrefix: string;
  nextInvoiceNumber: number;
  financialYear: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  openingStock: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  currentDue: number;
  totalPurchases: number;
  totalPaid: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  currentDue: number;
  totalPurchased: number;
  totalPaid: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  purchasePrice: number; // for COGS calculation
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  businessId: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bank' | 'mfs' | 'credit';
  paymentAccountId?: string;
  notes?: string;
  status: 'paid' | 'partial' | 'due' | 'returned';
  createdBy: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'cash' | 'bank' | 'mfs' | 'credit';
  paymentAccountId?: string;
  notes?: string;
  status: 'paid' | 'partial' | 'due' | 'returned';
  createdBy: string;
  createdAt: string;
}

export interface Account {
  id: string;
  businessId: string;
  name: string;
  type: 'cash' | 'bank' | 'mfs';
  accountNumber?: string;
  balance: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: string;
  amount: number;
  accountId: string;
  accountName: string;
  date: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'adjustment_in' | 'adjustment_out' | 'damaged' | 'lost';
  quantity: number;
  unitPrice?: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  businessId: string;
  returnType: 'sale_return' | 'purchase_return';
  invoiceId: string;
  invoiceNo: string;
  partyId: string;
  partyName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalRefund: number;
  paymentAccountId?: string;
  reason: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  actorUid: string;
  actorName: string;
  actorEmail?: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  createdAt: string;
}
