import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Account,
  AuditLog,
  BusinessMember,
  Customer,
  Expense,
  Product,
  Purchase,
  ReturnRecord,
  Sale,
  StockMovement,
  Supplier,
  UserRole
} from '../types';

interface BusinessContextType {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  accounts: Account[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  returns: ReturnRecord[];
  auditLogs: AuditLog[];
  members: BusinessMember[];
  loadingData: boolean;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'businessId' | 'createdAt'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, quantity: number, type: StockMovement['type'], notes: string) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'currentDue' | 'totalPurchases' | 'totalPaid'> & { openingBalance: number }) => Promise<string>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  collectCustomerPayment: (customerId: string, amount: number, accountId: string, notes?: string) => Promise<void>;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId' | 'createdAt' | 'currentDue' | 'totalPurchased' | 'totalPaid'> & { openingBalance: number }) => Promise<string>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  paySupplier: (supplierId: string, amount: number, accountId: string, notes?: string) => Promise<void>;

  createSale: (saleData: Omit<Sale, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'invoiceNo'>) => Promise<Sale>;
  createPurchase: (purchaseData: Omit<Purchase, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'invoiceNo'>) => Promise<Purchase>;

  addAccount: (account: Omit<Account, 'id' | 'businessId' | 'createdAt'>) => Promise<string>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'businessId' | 'createdAt' | 'createdBy'>) => Promise<string>;
  createReturnRecord: (data: Omit<ReturnRecord, 'id' | 'businessId' | 'createdAt'>) => Promise<void>;

  addMember: (email: string, displayName: string, role: UserRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Calculated Stats
  metrics: {
    totalSales: number;
    todaySales: number;
    totalPurchases: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    cashBalance: number;
    bankBalance: number;
    mfsBalance: number;
    totalReceivables: number;
    totalPayables: number;
    totalProducts: number;
    lowStockCount: number;
    inventoryValue: number;
  };
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentBusiness, user, userProfile, updateBusinessProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const businessId = currentBusiness?.id;

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!businessId || !user) {
      setProducts([]);
      setCustomers([]);
      setSuppliers([]);
      setSales([]);
      setPurchases([]);
      setAccounts([]);
      setExpenses([]);
      setStockMovements([]);
      setReturns([]);
      setAuditLogs([]);
      setMembers([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    const unsubProducts = onSnapshot(
      collection(db, 'businesses', businessId, 'products'),
      (snap) => {
        const list: Product[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Product));
        setProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/products`)
    );

    const unsubCustomers = onSnapshot(
      collection(db, 'businesses', businessId, 'customers'),
      (snap) => {
        const list: Customer[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Customer));
        setCustomers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/customers`)
    );

    const unsubSuppliers = onSnapshot(
      collection(db, 'businesses', businessId, 'suppliers'),
      (snap) => {
        const list: Supplier[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Supplier));
        setSuppliers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/suppliers`)
    );

    const unsubSales = onSnapshot(
      collection(db, 'businesses', businessId, 'sales'),
      (snap) => {
        const list: Sale[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Sale));
        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSales(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/sales`)
    );

    const unsubPurchases = onSnapshot(
      collection(db, 'businesses', businessId, 'purchases'),
      (snap) => {
        const list: Purchase[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Purchase));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPurchases(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/purchases`)
    );

    const unsubAccounts = onSnapshot(
      collection(db, 'businesses', businessId, 'accounts'),
      (snap) => {
        const list: Account[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Account));
        setAccounts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/accounts`)
    );

    const unsubExpenses = onSnapshot(
      collection(db, 'businesses', businessId, 'expenses'),
      (snap) => {
        const list: Expense[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Expense));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExpenses(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/expenses`)
    );

    const unsubStock = onSnapshot(
      collection(db, 'businesses', businessId, 'stockMovements'),
      (snap) => {
        const list: StockMovement[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StockMovement));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStockMovements(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/stockMovements`)
    );

    const unsubReturns = onSnapshot(
      collection(db, 'businesses', businessId, 'returns'),
      (snap) => {
        const list: ReturnRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReturnRecord));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReturns(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/returns`)
    );

    const unsubLogs = onSnapshot(
      collection(db, 'businesses', businessId, 'auditLogs'),
      (snap) => {
        const list: AuditLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuditLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/auditLogs`)
    );

    const unsubMembers = onSnapshot(
      collection(db, 'businesses', businessId, 'members'),
      (snap) => {
        const list: BusinessMember[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BusinessMember));
        setMembers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/members`)
    );

    setLoadingData(false);

    return () => {
      unsubProducts();
      unsubCustomers();
      unsubSuppliers();
      unsubSales();
      unsubPurchases();
      unsubAccounts();
      unsubExpenses();
      unsubStock();
      unsubReturns();
      unsubLogs();
      unsubMembers();
    };
  }, [businessId, user]);

  const logAudit = async (action: string, module: string, details: string, recordId?: string) => {
    if (!businessId || !user) return;
    try {
      const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const auditLog: AuditLog = {
        id: logId,
        businessId,
        actorUid: user.uid,
        actorName: userProfile?.displayName || user.displayName || user.email || 'User',
        actorEmail: user.email || undefined,
        action,
        module,
        recordId,
        details,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'businesses', businessId, 'auditLogs', logId), sanitizeForFirestore(auditLog));
    } catch (e) {
      console.warn('Audit logging failed silently:', e);
    }
  };

  // --- Products & Inventory ---
  const addProduct = async (data: Omit<Product, 'id' | 'businessId' | 'createdAt'>): Promise<string> => {
    if (!businessId) throw new Error('No business active');
    const id = 'prod_' + Date.now();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id,
      businessId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const batch = writeBatch(db);
      const prodRef = doc(db, 'businesses', businessId, 'products', id);
      batch.set(prodRef, sanitizeForFirestore(newProduct));

      if (data.openingStock > 0) {
        const smId = 'sm_open_' + Date.now();
        const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
        const sm: StockMovement = {
          id: smId,
          businessId,
          productId: id,
          productName: data.name,
          type: 'adjustment_in',
          quantity: data.openingStock,
          unitPrice: data.purchasePrice,
          notes: 'Opening stock entry',
          createdBy: user?.displayName || 'User',
          createdAt: now,
        };
        batch.set(smRef, sanitizeForFirestore(sm));
      }

      await batch.commit();
      await logAudit('ADD_PRODUCT', 'Inventory', `Added product: ${data.name} (Qty: ${data.currentStock})`, id);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/products/${id}`);
    }
  };

  const updateProduct = async (id: string, update: Partial<Product>) => {
    if (!businessId) throw new Error('No business active');
    try {
      const docRef = doc(db, 'businesses', businessId, 'products', id);
      await updateDoc(docRef, sanitizeForFirestore({ ...update, updatedAt: new Date().toISOString() }));
      await logAudit('UPDATE_PRODUCT', 'Inventory', `Updated product: ${update.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!businessId) throw new Error('No business active');
    try {
      const p = products.find((x) => x.id === id);
      await deleteDoc(doc(db, 'businesses', businessId, 'products', id));
      await logAudit('DELETE_PRODUCT', 'Inventory', `Deleted product: ${p?.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${businessId}/products/${id}`);
    }
  };

  const adjustStock = async (
    productId: string,
    quantity: number,
    type: StockMovement['type'],
    notes: string
  ) => {
    if (!businessId) throw new Error('No business active');
    const prod = products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const now = new Date().toISOString();
    let newStock = prod.currentStock;
    if (type === 'adjustment_in') {
      newStock += quantity;
    } else {
      newStock = Math.max(0, newStock - quantity);
    }

    try {
      const batch = writeBatch(db);
      const prodRef = doc(db, 'businesses', businessId, 'products', productId);
      batch.update(prodRef, sanitizeForFirestore({ currentStock: newStock, updatedAt: now }));

      const smId = 'sm_' + Date.now();
      const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
      const movement: StockMovement = {
        id: smId,
        businessId,
        productId,
        productName: prod.name,
        type,
        quantity,
        unitPrice: prod.purchasePrice,
        notes,
        createdBy: user?.displayName || 'User',
        createdAt: now,
      };
      batch.set(smRef, sanitizeForFirestore(movement));

      await batch.commit();
      await logAudit('STOCK_ADJUSTMENT', 'Inventory', `${type} of ${quantity} units for ${prod.name}`, productId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/stockMovements`);
    }
  };

  // --- Customers ---
  const addCustomer = async (data: Omit<Customer, 'id' | 'businessId' | 'createdAt' | 'currentDue' | 'totalPurchases' | 'totalPaid'> & { openingBalance: number }): Promise<string> => {
    if (!businessId) throw new Error('No business active');
    const id = 'cust_' + Date.now();
    const newCust: Customer = {
      ...data,
      id,
      businessId,
      currentDue: data.openingBalance || 0,
      totalPurchases: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'businesses', businessId, 'customers', id), sanitizeForFirestore(newCust));
      await logAudit('ADD_CUSTOMER', 'Customers', `Added customer: ${data.name} (${data.phone})`, id);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/customers/${id}`);
    }
  };

  const updateCustomer = async (id: string, update: Partial<Customer>) => {
    if (!businessId) throw new Error('No business active');
    try {
      await updateDoc(doc(db, 'businesses', businessId, 'customers', id), sanitizeForFirestore(update));
      await logAudit('UPDATE_CUSTOMER', 'Customers', `Updated customer ${update.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/customers/${id}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!businessId) throw new Error('No business active');
    try {
      const c = customers.find((x) => x.id === id);
      await deleteDoc(doc(db, 'businesses', businessId, 'customers', id));
      await logAudit('DELETE_CUSTOMER', 'Customers', `Deleted customer ${c?.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${businessId}/customers/${id}`);
    }
  };

  const collectCustomerPayment = async (
    customerId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    if (!businessId) throw new Error('No business active');
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) throw new Error('Customer not found');
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account not found');

    const now = new Date().toISOString();
    try {
      const batch = writeBatch(db);

      // 1. Update customer dues
      const custRef = doc(db, 'businesses', businessId, 'customers', customerId);
      const newDue = Math.max(0, custDue(cust.currentDue - amount));
      const newPaid = (cust.totalPaid || 0) + amount;
      batch.update(custRef, sanitizeForFirestore({ currentDue: newDue, totalPaid: newPaid }));

      // 2. Update account balance
      const accRef = doc(db, 'businesses', businessId, 'accounts', accountId);
      batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) + amount }));

      // 3. Record in audit logs & payment entry
      await batch.commit();
      await logAudit(
        'COLLECT_PAYMENT',
        'Finance',
        `Collected payment of ${amount} from ${cust.name} into ${acc.name}. Notes: ${notes || 'N/A'}`,
        customerId
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/customers/${customerId}`);
    }
  };

  const custDue = (val: number) => Math.round(val * 100) / 100;

  // --- Suppliers ---
  const addSupplier = async (data: Omit<Supplier, 'id' | 'businessId' | 'createdAt' | 'currentDue' | 'totalPurchased' | 'totalPaid'> & { openingBalance: number }): Promise<string> => {
    if (!businessId) throw new Error('No business active');
    const id = 'supp_' + Date.now();
    const newSupp: Supplier = {
      ...data,
      id,
      businessId,
      currentDue: data.openingBalance || 0,
      totalPurchased: 0,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'businesses', businessId, 'suppliers', id), sanitizeForFirestore(newSupp));
      await logAudit('ADD_SUPPLIER', 'Suppliers', `Added supplier: ${data.name} (${data.phone})`, id);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/suppliers/${id}`);
    }
  };

  const updateSupplier = async (id: string, update: Partial<Supplier>) => {
    if (!businessId) throw new Error('No business active');
    try {
      await updateDoc(doc(db, 'businesses', businessId, 'suppliers', id), sanitizeForFirestore(update));
      await logAudit('UPDATE_SUPPLIER', 'Suppliers', `Updated supplier ${update.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/suppliers/${id}`);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!businessId) throw new Error('No business active');
    try {
      const s = suppliers.find((x) => x.id === id);
      await deleteDoc(doc(db, 'businesses', businessId, 'suppliers', id));
      await logAudit('DELETE_SUPPLIER', 'Suppliers', `Deleted supplier ${s?.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${businessId}/suppliers/${id}`);
    }
  };

  const paySupplier = async (
    supplierId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    if (!businessId) throw new Error('No business active');
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) throw new Error('Supplier not found');
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account not found');

    try {
      const batch = writeBatch(db);

      // 1. Update supplier dues
      const suppRef = doc(db, 'businesses', businessId, 'suppliers', supplierId);
      const newDue = Math.max(0, custDue(supp.currentDue - amount));
      const newPaid = (supp.totalPaid || 0) + amount;
      batch.update(suppRef, sanitizeForFirestore({ currentDue: newDue, totalPaid: newPaid }));

      // 2. Reduce account balance
      const accRef = doc(db, 'businesses', businessId, 'accounts', accountId);
      batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) - amount }));

      await batch.commit();
      await logAudit(
        'PAY_SUPPLIER',
        'Finance',
        `Paid ${amount} to supplier ${supp.name} from ${acc.name}. Notes: ${notes || 'N/A'}`,
        supplierId
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/suppliers/${supplierId}`);
    }
  };

  // --- Sales ---
  const createSale = async (
    saleData: Omit<Sale, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'invoiceNo'>
  ): Promise<Sale> => {
    if (!businessId || !currentBusiness) throw new Error('No business active');
    const nextNum = currentBusiness.nextInvoiceNumber || 1001;
    const prefix = currentBusiness.invoicePrefix || 'DMS-';
    const invoiceNo = `${prefix}${nextNum}`;
    const saleId = 'sale_' + Date.now();
    const now = new Date().toISOString();

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      businessId,
      invoiceNo,
      createdBy: user?.displayName || user?.email || 'User',
      createdAt: now,
    };

    try {
      const batch = writeBatch(db);

      // 1. Save Sale Document
      const saleRef = doc(db, 'businesses', businessId, 'sales', saleId);
      batch.set(saleRef, sanitizeForFirestore(newSale));

      // 2. Update stock for each product & create stock movements
      for (const item of saleData.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const prodRef = doc(db, 'businesses', businessId, 'products', item.productId);
          const updatedStock = Math.max(0, prod.currentStock - item.quantity);
          batch.update(prodRef, sanitizeForFirestore({ currentStock: updatedStock, updatedAt: now }));

          const smId = 'sm_sale_' + Date.now() + '_' + item.productId;
          const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
          const sm: StockMovement = {
            id: smId,
            businessId,
            productId: item.productId,
            productName: item.productName,
            type: 'sale',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            referenceId: invoiceNo,
            notes: `Sold via invoice ${invoiceNo}`,
            createdBy: user?.displayName || 'User',
            createdAt: now,
          };
          batch.set(smRef, sanitizeForFirestore(sm));
        }
      }

      // 3. Update customer balance if customer selected
      if (saleData.customerId) {
        const cust = customers.find((c) => c.id === saleData.customerId);
        if (cust) {
          const custRef = doc(db, 'businesses', businessId, 'customers', cust.id);
          const updatedDue = (cust.currentDue || 0) + saleData.dueAmount;
          const updatedPurchases = (cust.totalPurchases || 0) + saleData.total;
          const updatedPaid = (cust.totalPaid || 0) + saleData.paidAmount;
          batch.update(custRef, sanitizeForFirestore({
            currentDue: updatedDue,
            totalPurchases: updatedPurchases,
            totalPaid: updatedPaid,
          }));
        }
      }

      // 4. Update Account balance if paid amount > 0
      if (saleData.paidAmount > 0 && saleData.paymentAccountId) {
        const acc = accounts.find((a) => a.id === saleData.paymentAccountId);
        if (acc) {
          const accRef = doc(db, 'businesses', businessId, 'accounts', acc.id);
          batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) + saleData.paidAmount }));
        }
      }

      // 5. Increment nextInvoiceNumber in business
      const bizRef = doc(db, 'businesses', businessId);
      batch.update(bizRef, sanitizeForFirestore({ nextInvoiceNumber: nextNum + 1 }));

      await batch.commit();

      // Update current business local cache
      await updateBusinessProfile({ nextInvoiceNumber: nextNum + 1 });

      await logAudit(
        'CREATE_SALE',
        'Sales',
        `Generated invoice ${invoiceNo} for ${saleData.customerName} - Total: ${saleData.total}, Paid: ${saleData.paidAmount}`,
        saleId
      );

      return newSale;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/sales/${saleId}`);
    }
  };

  // --- Purchases ---
  const createPurchase = async (
    purchaseData: Omit<Purchase, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'invoiceNo'>
  ): Promise<Purchase> => {
    if (!businessId || !currentBusiness) throw new Error('No business active');
    const count = purchases.length + 1;
    const invoiceNo = `PUR-${String(count).padStart(4, '0')}`;
    const purchaseId = 'pur_' + Date.now();
    const now = new Date().toISOString();

    const newPurchase: Purchase = {
      ...purchaseData,
      id: purchaseId,
      businessId,
      invoiceNo,
      createdBy: user?.displayName || user?.email || 'User',
      createdAt: now,
    };

    try {
      const batch = writeBatch(db);

      // 1. Save Purchase Document
      const purRef = doc(db, 'businesses', businessId, 'purchases', purchaseId);
      batch.set(purRef, sanitizeForFirestore(newPurchase));

      // 2. Increase stock for each product & create stock movements
      for (const item of purchaseData.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const prodRef = doc(db, 'businesses', businessId, 'products', item.productId);
          const updatedStock = prod.currentStock + item.quantity;
          batch.update(prodRef, sanitizeForFirestore({
            currentStock: updatedStock,
            purchasePrice: item.purchasePrice, // update latest purchase price
            updatedAt: now,
          }));

          const smId = 'sm_pur_' + Date.now() + '_' + item.productId;
          const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
          const sm: StockMovement = {
            id: smId,
            businessId,
            productId: item.productId,
            productName: item.productName,
            type: 'purchase',
            quantity: item.quantity,
            unitPrice: item.purchasePrice,
            referenceId: invoiceNo,
            notes: `Purchased via bill ${invoiceNo}`,
            createdBy: user?.displayName || 'User',
            createdAt: now,
          };
          batch.set(smRef, sanitizeForFirestore(sm));
        }
      }

      // 3. Update supplier balance
      if (purchaseData.supplierId) {
        const supp = suppliers.find((s) => s.id === purchaseData.supplierId);
        if (supp) {
          const suppRef = doc(db, 'businesses', businessId, 'suppliers', supp.id);
          const updatedDue = (supp.currentDue || 0) + purchaseData.dueAmount;
          const updatedPurchased = (supp.totalPurchased || 0) + purchaseData.total;
          const updatedPaid = (supp.totalPaid || 0) + purchaseData.paidAmount;
          batch.update(suppRef, sanitizeForFirestore({
            currentDue: updatedDue,
            totalPurchased: updatedPurchased,
            totalPaid: updatedPaid,
          }));
        }
      }

      // 4. Reduce account balance if paidAmount > 0
      if (purchaseData.paidAmount > 0 && purchaseData.paymentAccountId) {
        const acc = accounts.find((a) => a.id === purchaseData.paymentAccountId);
        if (acc) {
          const accRef = doc(db, 'businesses', businessId, 'accounts', acc.id);
          batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) - purchaseData.paidAmount }));
        }
      }

      await batch.commit();

      await logAudit(
        'CREATE_PURCHASE',
        'Purchases',
        `Recorded purchase ${invoiceNo} from ${purchaseData.supplierName} - Total: ${purchaseData.total}, Paid: ${purchaseData.paidAmount}`,
        purchaseId
      );

      return newPurchase;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/purchases/${purchaseId}`);
    }
  };

  // --- Accounts ---
  const addAccount = async (data: Omit<Account, 'id' | 'businessId' | 'createdAt'>): Promise<string> => {
    if (!businessId) throw new Error('No business active');
    const id = 'acc_' + Date.now();
    const newAcc: Account = {
      ...data,
      id,
      businessId,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'businesses', businessId, 'accounts', id), sanitizeForFirestore(newAcc));
      await logAudit('ADD_ACCOUNT', 'Finance', `Created financial account: ${data.name} (${data.type})`, id);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/accounts/${id}`);
    }
  };

  const updateAccount = async (id: string, update: Partial<Account>) => {
    if (!businessId) throw new Error('No business active');
    try {
      await updateDoc(doc(db, 'businesses', businessId, 'accounts', id), sanitizeForFirestore(update));
      await logAudit('UPDATE_ACCOUNT', 'Finance', `Updated account ${update.name || id}`, id);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/accounts/${id}`);
    }
  };

  const transferFunds = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    notes?: string
  ) => {
    if (!businessId) throw new Error('No business active');
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) throw new Error('Accounts not found');
    if (fromAcc.balance < amount) throw new Error('Insufficient funds in source account');

    try {
      const batch = writeBatch(db);
      const fromRef = doc(db, 'businesses', businessId, 'accounts', fromAccountId);
      const toRef = doc(db, 'businesses', businessId, 'accounts', toAccountId);

      batch.update(fromRef, sanitizeForFirestore({ balance: fromAcc.balance - amount }));
      batch.update(toRef, sanitizeForFirestore({ balance: toAcc.balance + amount }));

      await batch.commit();
      await logAudit(
        'ACCOUNT_TRANSFER',
        'Finance',
        `Transferred ${amount} from ${fromAcc.name} to ${toAcc.name}. Reason: ${notes || 'Fund Transfer'}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/accounts`);
    }
  };

  // --- Expenses ---
  const addExpense = async (
    data: Omit<Expense, 'id' | 'businessId' | 'createdAt' | 'createdBy'>
  ): Promise<string> => {
    if (!businessId) throw new Error('No business active');
    const id = 'exp_' + Date.now();
    const newExp: Expense = {
      ...data,
      id,
      businessId,
      createdBy: user?.displayName || user?.email || 'User',
      createdAt: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      const expRef = doc(db, 'businesses', businessId, 'expenses', id);
      batch.set(expRef, sanitizeForFirestore(newExp));

      // Deduct from account
      const acc = accounts.find((a) => a.id === data.accountId);
      if (acc) {
        const accRef = doc(db, 'businesses', businessId, 'accounts', acc.id);
        batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) - data.amount }));
      }

      await batch.commit();
      await logAudit(
        'ADD_EXPENSE',
        'Finance',
        `Recorded expense of ${data.amount} for ${data.category} (${data.description}) from ${data.accountName}`,
        id
      );
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/expenses/${id}`);
    }
  };

  // --- Returns & Refunds ---
  const createReturnRecord = async (
    data: Omit<ReturnRecord, 'id' | 'businessId' | 'createdAt'>
  ) => {
    if (!businessId) throw new Error('No business active');
    const id = 'ret_' + Date.now();
    const now = new Date().toISOString();
    const newRet: ReturnRecord = {
      ...data,
      id,
      businessId,
      createdAt: now,
    };

    try {
      const batch = writeBatch(db);
      const retRef = doc(db, 'businesses', businessId, 'returns', id);
      batch.set(retRef, sanitizeForFirestore(newRet));

      if (data.returnType === 'sale_return') {
        // Customer returned items: increase product stock, deduct customer purchase/due or refund from account
        for (const it of data.items) {
          const prod = products.find((p) => p.id === it.productId);
          if (prod) {
            const pRef = doc(db, 'businesses', businessId, 'products', it.productId);
            batch.update(pRef, sanitizeForFirestore({ currentStock: prod.currentStock + it.quantity, updatedAt: now }));

            const smId = 'sm_ret_' + Date.now() + '_' + it.productId;
            const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
            batch.set(smRef, sanitizeForFirestore({
              id: smId,
              businessId,
              productId: it.productId,
              productName: it.productName,
              type: 'sale_return',
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              referenceId: data.invoiceNo,
              notes: `Customer return: ${data.reason}`,
              createdBy: user?.displayName || 'User',
              createdAt: now,
            }));
          }
        }

        // If refund was paid out from an account
        if (data.paymentAccountId && data.totalRefund > 0) {
          const acc = accounts.find((a) => a.id === data.paymentAccountId);
          if (acc) {
            const accRef = doc(db, 'businesses', businessId, 'accounts', acc.id);
            batch.update(accRef, sanitizeForFirestore({ balance: (acc.balance || 0) - data.totalRefund }));
          }
        }
      } else {
        // Purchase return: returned items to supplier (decrease stock, reduce supplier due or receive refund)
        for (const it of data.items) {
          const prod = products.find((p) => p.id === it.productId);
          if (prod) {
            const pRef = doc(db, 'businesses', businessId, 'products', it.productId);
            batch.update(pRef, sanitizeForFirestore({ currentStock: Math.max(0, prod.currentStock - it.quantity), updatedAt: now }));

            const smId = 'sm_pret_' + Date.now() + '_' + it.productId;
            const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
            batch.set(smRef, sanitizeForFirestore({
              id: smId,
              businessId,
              productId: it.productId,
              productName: it.productName,
              type: 'purchase_return',
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              referenceId: data.invoiceNo,
              notes: `Supplier return: ${data.reason}`,
              createdBy: user?.displayName || 'User',
              createdAt: now,
            }));
          }
        }
      }

      await batch.commit();
      await logAudit(
        'CREATE_RETURN',
        'Returns',
        `${data.returnType} recorded for ${data.invoiceNo} - Refund: ${data.totalRefund}`,
        id
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/returns/${id}`);
    }
  };

  // --- Members / Staff ---
  const addMember = async (email: string, displayName: string, role: UserRole) => {
    if (!businessId) throw new Error('No business active');
    const memberId = 'mem_' + Date.now();
    const newMember: BusinessMember = {
      id: memberId,
      businessId,
      userId: 'pending_' + Date.now(),
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'businesses', businessId, 'members', memberId), sanitizeForFirestore(newMember));
      await logAudit('ADD_MEMBER', 'Employees', `Added employee ${displayName} (${email}) with role: ${role}`, memberId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/members/${memberId}`);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!businessId) throw new Error('No business active');
    try {
      const m = members.find((x) => x.id === memberId);
      await deleteDoc(doc(db, 'businesses', businessId, 'members', memberId));
      await logAudit('REMOVE_MEMBER', 'Employees', `Removed employee ${m?.displayName || memberId}`, memberId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `businesses/${businessId}/members/${memberId}`);
    }
  };

  // --- Computed Business Metrics ---
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    let totalSales = 0;
    let todaySales = 0;
    let costOfGoodsSold = 0;

    sales.forEach((s) => {
      totalSales += s.total || 0;
      if (s.createdAt.startsWith(today)) {
        todaySales += s.total || 0;
      }
      // calculate cogs
      s.items?.forEach((it) => {
        costOfGoodsSold += (it.purchasePrice || 0) * (it.quantity || 0);
      });
    });

    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const grossProfit = totalSales - costOfGoodsSold;
    const netProfit = grossProfit - totalExpenses;

    const cashBalance = accounts.filter((a) => a.type === 'cash').reduce((sum, a) => sum + (a.balance || 0), 0);
    const bankBalance = accounts.filter((a) => a.type === 'bank').reduce((sum, a) => sum + (a.balance || 0), 0);
    const mfsBalance = accounts.filter((a) => a.type === 'mfs').reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalReceivables = customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.currentDue || 0), 0);

    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
    const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

    return {
      totalSales,
      todaySales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      cashBalance,
      bankBalance,
      mfsBalance,
      totalReceivables,
      totalPayables,
      totalProducts,
      lowStockCount,
      inventoryValue,
    };
  }, [sales, purchases, expenses, accounts, customers, suppliers, products]);

  return (
    <BusinessContext.Provider
      value={{
        products,
        customers,
        suppliers,
        sales,
        purchases,
        accounts,
        expenses,
        stockMovements,
        returns,
        auditLogs,
        members,
        loadingData,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        collectCustomerPayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        paySupplier,
        createSale,
        createPurchase,
        addAccount,
        updateAccount,
        transferFunds,
        addExpense,
        createReturnRecord,
        addMember,
        removeMember,
        metrics,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return ctx;
};
