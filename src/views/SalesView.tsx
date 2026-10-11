import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  Search,
  Filter,
  Users,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Customer, Product, Sale, SaleItem } from '../types';

interface SalesViewProps {
  onViewInvoice: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onViewInvoice }) => {
  const { currentBusiness } = useAuth();
  const {
    sales,
    products,
    customers,
    accounts,
    createSale,
    addCustomer,
    createReturnRecord
  } = useBusiness();

  const currency = currentBusiness?.currency || '৳';

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Search & Filter for History
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'DUE'>('ALL');

  // New Invoice Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mfs' | 'credit'>('cash');
  const [paymentAccountId, setPaymentAccountId] = useState<string>(
    accounts.find((a) => a.type === 'cash')?.id || accounts[0]?.id || ''
  );
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick New Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Return Modal state
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnQty, setReturnQty] = useState<Record<string, number>>({});

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.subtotal, 0);
  }, [cartItems]);

  const taxAmount = useMemo(() => {
    return Math.round(((subtotal - discountAmount) * (taxPercent / 100)) * 100) / 100;
  }, [subtotal, discountAmount, taxPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const dueAmount = useMemo(() => {
    return Math.max(0, grandTotal - paidAmount);
  }, [grandTotal, paidAmount]);

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex((it) => it.productId === product.id);
    if (existingIndex > -1) {
      const current = cartItems[existingIndex];
      if (current.quantity >= product.currentStock) {
        alert(`Cannot add more than available stock (${product.currentStock} ${product.unit})`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex] = {
        ...current,
        quantity: current.quantity + 1,
        subtotal: (current.quantity + 1) * current.unitPrice,
      };
      setCartItems(updated);
    } else {
      if (product.currentStock <= 0) {
        alert('This product is out of stock!');
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

  const handleUpdateCartQty = (productId: string, qty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (qty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (prod && qty > prod.currentStock) {
      alert(`Stock limit reached! Available: ${prod.currentStock} ${prod.unit}`);
      return;
    }
    setCartItems(
      cartItems.map((it) =>
        it.productId === productId
          ? { ...it, quantity: qty, subtotal: qty * it.unitPrice }
          : it
      )
    );
  };

  const handleUpdateCartPrice = (productId: string, price: number) => {
    setCartItems(
      cartItems.map((it) =>
        it.productId === productId
          ? { ...it, unitPrice: price, subtotal: it.quantity * price }
          : it
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((it) => it.productId !== productId));
  };

  const handleSaveSale = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one product to the invoice');
      return;
    }

    setSubmitting(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const status: Sale['status'] =
        dueAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'due';

      const sale = await createSale({
        customerId: customer?.id || '',
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || undefined,
        items: cartItems,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: grandTotal,
        paidAmount,
        dueAmount,
        paymentMethod,
        paymentAccountId: paidAmount > 0 ? paymentAccountId : undefined,
        notes: invoiceNotes.trim() || undefined,
        status,
      });

      // Clear Form
      setCartItems([]);
      setDiscountAmount(0);
      setTaxPercent(0);
      setPaidAmount(0);
      setInvoiceNotes('');
      setSelectedCustomerId('');

      // Open print preview
      onViewInvoice(sale);
    } catch (err: any) {
      alert(err.message || 'Error creating sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomerQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newId = await addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'N/A',
      address: newCustAddress.trim() || undefined,
      openingBalance: 0,
    });
    setSelectedCustomerId(newId);
    setIsCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Filtered Sales History
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoiceNo.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.customerName.toLowerCase().includes(historySearch.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'PAID') matchStatus = s.dueAmount <= 0;
      else if (statusFilter === 'PARTIAL') matchStatus = s.dueAmount > 0 && s.paidAmount > 0;
      else if (statusFilter === 'DUE') matchStatus = s.paidAmount === 0 && s.dueAmount > 0;

      return matchSearch && matchStatus;
    });
  }, [sales, historySearch, statusFilter]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSale) return;

    const returnItems: { productId: string; productName: string; quantity: number; unitPrice: number }[] = [];
    let refundTotal = 0;

    returnSale.items.forEach((it) => {
      const qty = returnQty[it.productId] || 0;
      if (qty > 0) {
        returnItems.push({
          productId: it.productId,
          productName: it.productName,
          quantity: qty,
          unitPrice: it.unitPrice,
        });
        refundTotal += qty * it.unitPrice;
      }
    });

    if (returnItems.length === 0) {
      alert('Select at least one item to return');
      return;
    }

    await createReturnRecord({
      returnType: 'sale_return',
      invoiceId: returnSale.id,
      invoiceNo: returnSale.invoiceNo,
      partyId: returnSale.customerId,
      partyName: returnSale.customerName,
      items: returnItems,
      totalRefund: refundTotal,
      paymentAccountId: accounts[0]?.id,
      reason: returnReason.trim() || 'Customer return',
    });

    setReturnSale(null);
    setReturnQty({});
    setReturnReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sales & POS Invoicing</h1>
          <p className="text-xs text-slate-400">
            Create invoices, record cash/credit sales, automatically decrement stock, and print receipts.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create New Invoice
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sales History ({sales.length})
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        /* POS & INVOICE CREATION INTERFACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Picker */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white">Select Products</h2>
              <span className="text-xs text-slate-400">{products.length} products available</span>
            </div>

            {/* Product Quick Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {products.map((p) => {
                const isOut = p.currentStock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOut && handleAddToCart(p)}
                    className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isOut
                        ? 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                        : 'bg-slate-950 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/30 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {currency}{p.sellingPrice.toLocaleString()}
                      </span>
                      <span className={`text-[10px] font-semibold ${isOut ? 'text-rose-400' : 'text-slate-400'}`}>
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart & Billing Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="font-bold text-base text-white">Invoice Cart</h2>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Next: {currentBusiness?.invoicePrefix || 'DMS-'}{currentBusiness?.nextInvoiceNumber || 1001}
              </span>
            </div>

            {/* Customer Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Customer</label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ New Customer</span>
                </button>
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Walk-in Customer (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Due: {currency}{c.currentDue}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Cart is empty. Click items on the left to add.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-white truncate">{item.productName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {currency}{item.unitPrice} / {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateCartQty(item.productId, parseInt(e.target.value) || 1)}
                        className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                      />
                      <span className="font-mono font-bold text-emerald-400 w-16 text-right">
                        {currency}{item.subtotal.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discounts */}
            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white font-semibold">
                  {currency}{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Discount ({currency}):</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right font-mono text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">VAT / Tax (%):</span>
                <input
                  type="number"
                  min="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-right font-mono text-white text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-base">
                  {currency}{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-slate-800 pt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mfs">bKash / Nagad / MFS</option>
                    <option value="credit">Full Credit (Due)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Deposit Account
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Paid Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Due Amount ({currency})
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${currency}${dueAmount.toLocaleString()}`}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold ${
                      dueAmount > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Full-Pay Button */}
              <button
                type="button"
                onClick={() => setPaidAmount(grandTotal)}
                className="text-[11px] text-emerald-400 hover:underline block"
              >
                Set full paid amount ({currency}{grandTotal.toLocaleString()})
              </button>

              <button
                type="button"
                disabled={submitting || cartItems.length === 0}
                onClick={handleSaveSale}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 mt-2"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale & Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SALES HISTORY TAB */
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search invoice number or customer..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('PARTIAL')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'PARTIAL' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                }`}
              >
                Partial
              </button>
              <button
                onClick={() => setStatusFilter('DUE')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'DUE' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                }`}
              >
                Due
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {filteredSales.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                No invoices found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-right">Paid</th>
                      <th className="py-3 px-3 text-right">Due</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">{s.invoiceNo}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {s.customerName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {currency}{s.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                          {currency}{s.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                          {currency}{s.dueAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {s.dueAmount <= 0 ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                              Paid
                            </span>
                          ) : s.paidAmount > 0 ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                              Partial
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full">
                              Due
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onViewInvoice(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                              title="Print / View Invoice"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => {
                                setReturnSale(s);
                                const initialQty: Record<string, number> = {};
                                s.items.forEach((it) => (initialQty[it.productId] = 0));
                                setReturnQty(initialQty);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                              title="Process Return / Refund"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-3">Add Customer Quickly</h3>
            <form onSubmit={handleCreateCustomerQuick} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahim Mia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Market road, Shop 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Return Modal */}
      {returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Process Sales Return</h3>
            <p className="text-xs text-slate-400 mb-4">
              Invoice #{returnSale.invoiceNo} • Customer: {returnSale.customerName}
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Items to Return:</div>
                {returnSale.items.map((it) => (
                  <div key={it.productId} className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <div className="font-bold text-white">{it.productName}</div>
                      <div className="text-slate-400">Sold: {it.quantity} {it.unit} @ {currency}{it.unitPrice}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max={it.quantity}
                        value={returnQty[it.productId] || 0}
                        onChange={(e) =>
                          setReturnQty({ ...returnQty, [it.productId]: parseInt(e.target.value) || 0 })
                        }
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Return
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Expired, damaged, excess order"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturnSale(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Confirm Return & Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
