import React, { useState } from 'react';
import {
  Zap,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  UserPlus,
  PackagePlus,
  X,
  CheckCircle2,
  Trash2,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Sale, PurchaseItem } from '../types';
import { SaleEntryModal } from './SaleEntryModal';

interface QuickActionsFABProps {
  onViewInvoice?: (sale: Sale) => void;
  onNavigate?: (view: string) => void;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({
  onViewInvoice,
  onNavigate,
}) => {
  const { currentBusiness, permissions } = useAuth();
  const {
    products,
    customers,
    suppliers,
    accounts,
    createPurchase,
    addExpense,
    addProduct,
    addCustomer,
  } = useBusiness();

  const currency = currentBusiness?.currency || '৳';

  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'sale' | 'purchase' | 'expense' | 'customer' | 'product' | null>(null);

  // --- Instant Purchase State ---
  const [purSupplierId, setPurSupplierId] = useState('');
  const [purItems, setPurItems] = useState<PurchaseItem[]>([]);
  const [purPaid, setPurPaid] = useState<number>(0);
  const [purMethod, setPurMethod] = useState<'cash' | 'bank' | 'mfs' | 'credit'>('cash');
  const [purAccountId, setPurAccountId] = useState(accounts[0]?.id || '');
  const [purNotes, setPurNotes] = useState('');
  const [purSubmitting, setPurSubmitting] = useState(false);

  // --- Instant Expense State ---
  const [expCategory, setExpCategory] = useState('Miscellaneous Expense');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expAccountId, setExpAccountId] = useState(accounts[0]?.id || '');
  const [expDescription, setExpDescription] = useState('');
  const [expSubmitting, setExpSubmitting] = useState(false);

  // --- Instant Customer State ---
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // --- Instant Product State ---
  const [prodName, setProdName] = useState('');
  const [prodPurchasePrice, setProdPurchasePrice] = useState<number>(0);
  const [prodSellingPrice, setProdSellingPrice] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodCategory, setProdCategory] = useState('General');

  // Quick Purchase Calculations
  const purTotal = purItems.reduce((sum, it) => sum + it.subtotal, 0);
  const purDue = Math.max(0, purTotal - purPaid);

  // Handlers for Purchase
  const handleAddProductToPur = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = purItems.findIndex((it) => it.productId === productId);
    if (existingIndex > -1) {
      const updated = [...purItems];
      const cur = updated[existingIndex];
      updated[existingIndex] = {
        ...cur,
        quantity: cur.quantity + 1,
        subtotal: (cur.quantity + 1) * cur.purchasePrice,
      };
      setPurItems(updated);
    } else {
      setPurItems([
        ...purItems,
        {
          productId: prod.id,
          productName: prod.name,
          unit: prod.unit,
          quantity: 1,
          purchasePrice: prod.purchasePrice,
          subtotal: prod.purchasePrice,
        },
      ]);
    }
  };

  const handleExecuteInstantPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purItems.length === 0) {
      alert('Add at least one product to the purchase bill');
      return;
    }
    if (!purSupplierId) {
      alert('Select a supplier');
      return;
    }

    setPurSubmitting(true);
    try {
      const supp = suppliers.find((s) => s.id === purSupplierId);
      const status = purDue <= 0 ? 'paid' : purPaid > 0 ? 'partial' : 'due';

      await createPurchase({
        supplierId: supp!.id,
        supplierName: supp!.name,
        items: purItems,
        subtotal: purTotal,
        discount: 0,
        total: purTotal,
        paidAmount: purPaid,
        dueAmount: purDue,
        paymentMethod: purMethod,
        paymentAccountId: purPaid > 0 ? purAccountId : undefined,
        notes: purNotes.trim() || 'Recorded via Quick Actions FAB',
        status,
      });

      setPurItems([]);
      setPurPaid(0);
      setPurNotes('');
      setPurSupplierId('');
      setModalType(null);
      setIsOpen(false);
      alert('Purchase recorded and stock updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to record purchase');
    } finally {
      setPurSubmitting(false);
    }
  };

  // Handler for Expense
  const handleExecuteInstantExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) {
      alert('Enter a valid expense amount');
      return;
    }

    setExpSubmitting(true);
    try {
      const acc = accounts.find((a) => a.id === expAccountId);
      await addExpense({
        category: expCategory,
        amount: Number(expAmount),
        accountId: expAccountId,
        accountName: acc?.name || 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: expDescription.trim() || expCategory,
      });

      setExpAmount(0);
      setExpDescription('');
      setModalType(null);
      setIsOpen(false);
      alert('Expense recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    } finally {
      setExpSubmitting(false);
    }
  };

  // Handler for Customer
  const handleExecuteQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;
    await addCustomer({
      name: custName.trim(),
      phone: custPhone.trim() || 'N/A',
      address: custAddress.trim() || undefined,
      openingBalance: 0,
    });
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setModalType(null);
    setIsOpen(false);
    alert('Customer added successfully!');
  };

  // Handler for Product
  const handleExecuteQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    await addProduct({
      name: prodName.trim(),
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      category: prodCategory.trim() || 'General',
      unit: 'pcs',
      purchasePrice: Number(prodPurchasePrice),
      sellingPrice: Number(prodSellingPrice),
      currentStock: Number(prodStock),
      openingStock: Number(prodStock),
      minStockAlert: 5,
    });
    setProdName('');
    setProdPurchasePrice(0);
    setProdSellingPrice(0);
    setProdStock(10);
    setModalType(null);
    setIsOpen(false);
    alert('Product added to inventory!');
  };

  return (
    <>
      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
        {/* Speed Dial Menu Items */}
        {isOpen && (
          <div className="mb-3 flex flex-col items-end space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Record Sale Action */}
            {permissions.canCreateSales && (
              <button
                onClick={() => {
                  setModalType('sale');
                }}
                className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all group hover:border-emerald-500/50 cursor-pointer"
              >
                <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  Instant Sale / POS
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Record Purchase Action */}
            {permissions.canCreatePurchases && (
              <button
                onClick={() => {
                  setPurItems([]);
                  setPurPaid(0);
                  setPurNotes('');
                  setPurAccountId(accounts[0]?.id || '');
                  setModalType('purchase');
                }}
                className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all group hover:border-cyan-500/50"
              >
                <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  Instant Purchase Bill
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Record Expense Action */}
            {permissions.canManageFinance && (
              <button
                onClick={() => {
                  setExpAmount(0);
                  setExpDescription('');
                  setExpAccountId(accounts[0]?.id || '');
                  setModalType('expense');
                }}
                className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all group hover:border-amber-500/50"
              >
                <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  Instant Expense
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Quick Add Product */}
            {permissions.canManageInventory && (
              <button
                onClick={() => {
                  setProdName('');
                  setProdPurchasePrice(0);
                  setProdSellingPrice(0);
                  setProdStock(10);
                  setModalType('product');
                }}
                className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all group hover:border-indigo-500/50"
              >
                <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                  Quick Add Product
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <PackagePlus className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* Quick Add Customer */}
            <button
              onClick={() => {
                setCustName('');
                setCustPhone('');
                setCustAddress('');
                setModalType('customer');
              }}
              className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all group hover:border-purple-500/50"
            >
              <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300">
                Quick Add Customer
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-5 py-3.5 rounded-2xl font-black text-xs text-white shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 border border-slate-700 rotate-0 shadow-slate-950/80'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/80 ring-4 ring-emerald-500/30'
          }`}
          title="Quick Actions Menu"
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-slate-300" />
              <span>Close Menu</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="tracking-wide">Quick Actions</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. REUSABLE SALE ENTRY MODAL (With atomic Firestore transaction)         */}
      {/* ========================================================================= */}
      <SaleEntryModal
        isOpen={modalType === 'sale'}
        onClose={() => setModalType(null)}
        onSaleCompleted={(createdSale) => {
          setModalType(null);
          setIsOpen(false);
          if (onViewInvoice) {
            onViewInvoice(createdSale);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 2. INSTANT PURCHASE MODAL */}
      {/* ========================================================================= */}
      {modalType === 'purchase' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Instant Purchase Bill</h3>
                  <p className="text-[11px] text-slate-400">Record inventory restocking directly</p>
                </div>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteInstantPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    required
                    value={purSupplierId}
                    onChange={(e) => setPurSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone}) - Payable: {currency}{s.currentDue}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Add Product to Restock
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProductToPur(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-medium"
                  >
                    <option value="">+ Choose product to restock...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Cost: {currency}{p.purchasePrice} (Current: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Items to Restock ({purItems.length})</span>
                  <span className="text-slate-400">Total Cost</span>
                </div>

                {purItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Select items above to add to the purchase order.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {purItems.map((it) => (
                      <div
                        key={it.productId}
                        className="flex items-center justify-between text-xs p-2 bg-slate-900 rounded-xl"
                      >
                        <div className="flex-1 mr-2">
                          <div className="font-semibold text-white truncate">{it.productName}</div>
                          <div className="text-[10px] text-slate-400">{it.unit}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => {
                              const q = parseInt(e.target.value) || 1;
                              setPurItems(
                                purItems.map((x) =>
                                  x.productId === it.productId
                                    ? { ...x, quantity: q, subtotal: q * x.purchasePrice }
                                    : x
                                )
                              );
                            }}
                            className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-center font-bold text-white text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={it.purchasePrice}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              setPurItems(
                                purItems.map((x) =>
                                  x.productId === it.productId
                                    ? { ...x, purchasePrice: p, subtotal: it.quantity * p }
                                    : x
                                )
                              );
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-right font-mono text-cyan-400 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setPurItems(purItems.filter((x) => x.productId !== it.productId))}
                            className="text-slate-500 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-white">
                  <span>Grand Total:</span>
                  <span className="font-mono text-cyan-400 text-base">{currency}{purTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={purMethod}
                    onChange={(e) => setPurMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mfs">bKash / Nagad</option>
                    <option value="credit">Full Credit (Payable Due)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Paid Amount ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={purPaid}
                    onChange={(e) => setPurPaid(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setPurPaid(purTotal)}
                    className="text-[10px] text-cyan-400 hover:underline mt-0.5 block"
                  >
                    Full Paid
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payable Due ({currency})</label>
                  <input
                    type="text"
                    disabled
                    value={`${currency}${purDue.toLocaleString()}`}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold ${
                      purDue > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purSubmitting || purItems.length === 0 || !purSupplierId}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {purSubmitting ? 'Saving...' : 'Confirm Purchase Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INSTANT EXPENSE MODAL */}
      {/* ========================================================================= */}
      {modalType === 'expense' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Instant Expense</h3>
                  <p className="text-[11px] text-slate-400">Quickly record shop overhead costs</p>
                </div>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteInstantExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                >
                  <option value="Rent & Utilities">Rent & Utilities</option>
                  <option value="Employee Salaries">Employee Salaries</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Transport & Logistics">Transport & Logistics</option>
                  <option value="Packaging & Supplies">Packaging & Supplies</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Office & Shop Maintenance">Maintenance</option>
                  <option value="Miscellaneous Expense">Miscellaneous Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paid From Account *
                </label>
                <select
                  value={expAccountId}
                  onChange={(e) => setExpAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({currency}{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="e.g. Guest hospitality, electricity token"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expSubmitting || expAmount <= 0}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {expSubmitting ? 'Recording...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INSTANT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {modalType === 'customer' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-3">Quick Add Customer</h3>
            <form onSubmit={handleExecuteQuickCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Mohammad Karim"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Area / Market"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INSTANT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {modalType === 'product' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-3">Quick Add Product Item</h3>
            <form onSubmit={handleExecuteQuickProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Energy Drink 250ml"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    placeholder="General"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
