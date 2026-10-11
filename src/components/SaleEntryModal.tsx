import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  DollarSign,
  User,
  UserPlus,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  Sparkles
} from 'lucide-react';
import { runTransaction, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Customer, Product, Sale, SaleItem } from '../types';

interface SaleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: (sale: Sale) => void;
}

export const SaleEntryModal: React.FC<SaleEntryModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
}) => {
  const { currentBusiness, user, userProfile, updateBusinessProfile } = useAuth();
  const { products, customers, accounts, addCustomer } = useBusiness();

  const businessId = currentBusiness?.id;
  const currency = currentBusiness?.currency || '৳';

  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Discount & Tax
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Payment
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mfs' | 'credit'>('cash');
  const [paymentAccountId, setPaymentAccountId] = useState<string>(
    accounts.find((a) => a.type === 'cash')?.id || accounts[0]?.id || ''
  );
  const [notes, setNotes] = useState('');

  // Processing state & error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline Quick Add Customer
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustAddress, setQuickCustAddress] = useState('');

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products for Picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, selectedCategory]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round(((subtotal * discountValue) / 100) * 100) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (taxPercent <= 0) return 0;
    return Math.round(((taxableAmount * taxPercent) / 100) * 100) / 100;
  }, [taxableAmount, taxPercent]);

  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex((it) => it.productId === product.id);
    if (existingIndex > -1) {
      const existing = cartItems[existingIndex];
      if (existing.quantity >= product.currentStock) {
        alert(`Cannot exceed available stock (${product.currentStock} ${product.unit})`);
        return;
      }
      const updated = [...cartItems];
      const newQty = existing.quantity + 1;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * existing.unitPrice,
      };
      setCartItems(updated);
    } else {
      if (product.currentStock <= 0) {
        alert(`"${product.name}" is currently out of stock!`);
        return;
      }
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        unitPrice: product.sellingPrice,
        quantity: 1,
        subtotal: product.sellingPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQty = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    if (prod && quantity > prod.currentStock) {
      alert(`Cannot exceed available stock (${prod.currentStock} ${prod.unit})`);
      return;
    }
    setCartItems(
      cartItems.map((it) =>
        it.productId === productId
          ? { ...it, quantity, subtotal: quantity * it.unitPrice }
          : it
      )
    );
  };

  const handleUpdateUnitPrice = (productId: string, unitPrice: number) => {
    setCartItems(
      cartItems.map((it) =>
        it.productId === productId
          ? { ...it, unitPrice, subtotal: it.quantity * unitPrice }
          : it
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter((it) => it.productId !== productId));
  };

  // Quick Customer Creation
  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;
    try {
      const newId = await addCustomer({
        name: quickCustName.trim(),
        phone: quickCustPhone.trim() || 'N/A',
        address: quickCustAddress.trim() || undefined,
        openingBalance: 0,
      });
      setSelectedCustomerId(newId);
      setShowQuickCustomer(false);
      setQuickCustName('');
      setQuickCustPhone('');
      setQuickCustAddress('');
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    }
  };

  // =========================================================================
  // ATOMIC FIRESTORE TRANSACTION PROCESSING
  // =========================================================================
  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!businessId || !currentBusiness) {
      setErrorMessage('No active business found.');
      return;
    }
    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one product to the sale.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const saleId = 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      let resultingSale: Sale | null = null;

      // Execute atomic Firestore transaction
      await runTransaction(db, async (transaction) => {
        // --- 1. TRANSACTION READ PHASE (All reads MUST happen first) ---

        // Read Business Doc for invoice numbering
        const bizRef = doc(db, 'businesses', businessId);
        const bizSnap = await transaction.get(bizRef);
        if (!bizSnap.exists()) {
          throw new Error('Business document does not exist.');
        }
        const bizData = bizSnap.data();
        const nextNum = bizData.nextInvoiceNumber || 1001;
        const prefix = bizData.invoicePrefix || 'DMS-';
        const invoiceNo = `${prefix}${nextNum}`;

        // Read each Product Doc to verify and lock stock
        const productSnapshots: {
          ref: any;
          item: SaleItem;
          currentStock: number;
          purchasePrice: number;
        }[] = [];

        for (const item of cartItems) {
          const prodRef = doc(db, 'businesses', businessId, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          if (!prodSnap.exists()) {
            throw new Error(`Product "${item.productName}" no longer exists in inventory.`);
          }
          const pData = prodSnap.data();
          const availableStock = pData.currentStock ?? 0;

          if (availableStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.productName}". Available: ${availableStock} ${item.unit}, Requested: ${item.quantity}`
            );
          }

          productSnapshots.push({
            ref: prodRef,
            item,
            currentStock: availableStock,
            purchasePrice: pData.purchasePrice ?? item.purchasePrice,
          });
        }

        // Read Customer Doc if a customer is selected
        let customerSnap: any = null;
        let customerRef: any = null;
        if (selectedCustomerId) {
          customerRef = doc(db, 'businesses', businessId, 'customers', selectedCustomerId);
          customerSnap = await transaction.get(customerRef);
        }

        // Read Account Doc if paid amount > 0
        let accountSnap: any = null;
        let accountRef: any = null;
        if (paidAmount > 0 && paymentAccountId) {
          accountRef = doc(db, 'businesses', businessId, 'accounts', paymentAccountId);
          accountSnap = await transaction.get(accountRef);
          if (!accountSnap.exists()) {
            throw new Error('Selected payment account does not exist.');
          }
        }

        // --- 2. TRANSACTION WRITE PHASE (All writes executed atomically) ---

        // Prepare Sale Doc
        const custData = customerSnap?.exists() ? customerSnap.data() : null;
        const custName = custData?.name || 'Walk-in Customer';
        const custPhone = custData?.phone || undefined;
        const saleStatus: Sale['status'] =
          dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'due';

        const newSale: Sale = {
          id: saleId,
          businessId,
          invoiceNo,
          customerId: selectedCustomerId || '',
          customerName: custName,
          customerPhone: custPhone,
          items: cartItems,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total: grandTotal,
          paidAmount,
          dueAmount,
          paymentMethod,
          paymentAccountId: paidAmount > 0 ? paymentAccountId : undefined,
          notes: notes.trim() || undefined,
          status: saleStatus,
          createdBy: userProfile?.displayName || user?.displayName || user?.email || 'User',
          createdAt: now,
        };

        const saleRef = doc(db, 'businesses', businessId, 'sales', saleId);
        transaction.set(saleRef, sanitizeForFirestore(newSale));

        // Deduct inventory stock and record stock movements
        for (const ps of productSnapshots) {
          const newStock = ps.currentStock - ps.item.quantity;
          transaction.update(ps.ref, sanitizeForFirestore({
            currentStock: newStock,
            updatedAt: now,
          }));

          const smId = 'sm_sale_' + Date.now() + '_' + ps.item.productId;
          const smRef = doc(db, 'businesses', businessId, 'stockMovements', smId);
          transaction.set(smRef, sanitizeForFirestore({
            id: smId,
            businessId,
            productId: ps.item.productId,
            productName: ps.item.productName,
            type: 'sale',
            quantity: ps.item.quantity,
            unitPrice: ps.item.unitPrice,
            referenceId: invoiceNo,
            notes: `Sold via invoice ${invoiceNo}`,
            createdBy: newSale.createdBy,
            createdAt: now,
          }));
        }

        // Update Customer Ledger & Dues
        if (customerRef && customerSnap?.exists()) {
          const prevDue = customerSnap.data().currentDue || 0;
          const prevPurchases = customerSnap.data().totalPurchases || 0;
          const prevPaid = customerSnap.data().totalPaid || 0;

          transaction.update(customerRef, sanitizeForFirestore({
            currentDue: prevDue + dueAmount,
            totalPurchases: prevPurchases + grandTotal,
            totalPaid: prevPaid + paidAmount,
          }));
        }

        // Update Financial Account Balance
        if (accountRef && accountSnap?.exists()) {
          const prevBal = accountSnap.data().balance || 0;
          transaction.update(accountRef, sanitizeForFirestore({
            balance: prevBal + paidAmount,
          }));
        }

        // Increment Next Invoice Number
        transaction.update(bizRef, sanitizeForFirestore({
          nextInvoiceNumber: nextNum + 1,
        }));

        // Create Audit Log
        const logId = 'log_' + Date.now();
        const logRef = doc(db, 'businesses', businessId, 'auditLogs', logId);
        transaction.set(logRef, sanitizeForFirestore({
          id: logId,
          businessId,
          actorUid: user?.uid || 'unknown',
          actorName: newSale.createdBy,
          actorEmail: user?.email || undefined,
          action: 'CREATE_SALE_TRANSACTION',
          module: 'Sales',
          recordId: saleId,
          details: `Processed invoice ${invoiceNo} for ${custName} — Grand Total: ${grandTotal}, Paid: ${paidAmount}, Due: ${dueAmount}`,
          createdAt: now,
        }));

        resultingSale = newSale;
      });

      // Update local next invoice number in AuthContext cache
      await updateBusinessProfile({
        nextInvoiceNumber: (currentBusiness.nextInvoiceNumber || 1001) + 1,
      });

      // Reset Modal Form
      setCartItems([]);
      setSelectedCustomerId('');
      setDiscountValue(0);
      setTaxPercent(0);
      setPaidAmount(0);
      setNotes('');
      onClose();

      if (resultingSale && onSaleCompleted) {
        onSaleCompleted(resultingSale);
      }
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setErrorMessage(err.message || 'Transaction could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Sale Entry & POS Invoice</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">
                  ACID Transaction
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Invoice #{currentBusiness?.invoicePrefix || 'DMS-'}{currentBusiness?.nextInvoiceNumber || 1001} • Guaranteed atomic inventory & ledger sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-column layout */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Product Catalog Browser */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Products from Database
              </span>
              <span className="text-xs text-slate-400">
                {filteredProducts.length} items available
              </span>
            </div>

            {/* Product Search & Category Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by name, SKU, or barcode..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[130px]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Product Card Grid */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-slate-500 text-xs">
                  No matching products in database.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = p.currentStock <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOut && handleAddToCart(p)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between text-left ${
                        isOut
                          ? 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-800/40 cursor-pointer shadow-sm active:scale-98'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {currency}{p.sellingPrice.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-semibold ${isOut ? 'text-rose-400' : 'text-slate-400'}`}>
                          {p.currentStock} {p.unit}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Invoice Builder & Calculations */}
          <div className="lg:col-span-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Picker */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Customer</label>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{showQuickCustomer ? 'Close' : '+ New Customer'}</span>
                </button>
              </div>

              {showQuickCustomer ? (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 mb-2 animate-in fade-in">
                  <input
                    type="text"
                    required
                    value={quickCustName}
                    onChange={(e) => setQuickCustName(e.target.value)}
                    placeholder="Customer Name *"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={quickCustPhone}
                      onChange={(e) => setQuickCustPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={quickCustAddress}
                      onChange={(e) => setQuickCustAddress(e.target.value)}
                      placeholder="Address"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCreateQuickCustomer}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs"
                    >
                      Save & Select
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Walk-in Customer (General)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — Due: {currency}{c.currentDue.toLocaleString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800 max-h-44 overflow-y-auto pr-1">
              <div className="text-[11px] font-semibold text-slate-400 flex justify-between px-1 mb-1">
                <span>Cart Products ({cartItems.length})</span>
                <span>Line Total</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Cart is empty. Click items on the left catalog to add.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2 bg-slate-900 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 mr-2 truncate">
                      <div className="font-semibold text-white truncate">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currency}{item.unitPrice} / {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value) || 1)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-white text-xs"
                      />
                      <span className="font-mono font-bold text-emerald-400 w-16 text-right">
                        {currency}{item.subtotal.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Calculations (Subtotal, Discounts, Tax) */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white font-semibold">
                  {currency}{subtotal.toLocaleString()}
                </span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1 text-slate-400">
                  <span>Discount:</span>
                  <div className="inline-flex bg-slate-900 rounded-md p-0.5 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-1.5 py-0.5 rounded font-bold ${discountType === 'fixed' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      {currency}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 rounded font-bold ${discountType === 'percent' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white text-xs"
                />
              </div>

              {/* VAT/Tax */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">VAT / Tax (%):</span>
                <input
                  type="number"
                  min="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-white text-xs"
                />
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-base">
                  {currency}{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment & Ledger Adjustments */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mfs">bKash / Nagad</option>
                    <option value="credit">Full Credit (Due)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Deposit Account
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({currency}{a.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-semibold text-slate-400">
                      Paid Amount ({currency})
                    </label>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Full Paid
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Remaining Due Balance ({currency})
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currency}${dueAmount.toLocaleString()}`}
                    className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold ${
                      dueAmount > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || cartItems.length === 0}
                onClick={handleProcessSale}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Process Sale via Firestore Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
