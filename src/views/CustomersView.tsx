import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  DollarSign,
  FileText,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Customer } from '../types';

export const CustomersView: React.FC = () => {
  const { currentBusiness, permissions } = useAuth();
  const {
    customers,
    accounts,
    sales,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    collectCustomerPayment
  } = useBusiness();

  const currency = currentBusiness?.currency || '৳';

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Payment collection form states
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectAccountId, setCollectAccountId] = useState<string>(accounts[0]?.id || '');
  const [collectNotes, setCollectNotes] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [customers, search]);

  const totalDues = customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  const totalSalesToCustomers = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

  const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setOpeningBalance(0);
    setEditingCustomer(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setOpeningBalance(c.openingBalance || 0);
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        openingBalance: Number(openingBalance) || 0,
      });
    }
    setIsAddModalOpen(false);
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || collectAmount <= 0) return;
    await collectCustomerPayment(
      paymentCustomer.id,
      collectAmount,
      collectAccountId,
      collectNotes.trim() || undefined
    );
    setPaymentCustomer(null);
    setCollectAmount(0);
    setCollectNotes('');
  };

  const handleDelete = async (c: Customer) => {
    if (confirm(`Are you sure you want to delete customer "${c.name}"?`)) {
      await deleteCustomer(c.id);
    }
  };

  const getWhatsAppReminderUrl = (c: Customer) => {
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${c.name},\nThis is a friendly reminder from ${currentBusiness?.name}. Your current outstanding due balance is ${currency}${c.currentDue.toLocaleString()}.\nPlease arrange payment at your earliest convenience. Thank you!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Customer Directory & Dues</h1>
          <p className="text-xs text-slate-400">
            Track customer balances, payment collections, full transaction ledgers, and WhatsApp reminders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Registered Customers</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {customers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Receivables (Due Balance)</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
              {currency}{totalDues.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Sales Billed</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              {currency}{totalSalesToCustomers.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, or address..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No customers found. Add your first customer!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Customer Name & Contact</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Total Paid</th>
                  <th className="py-3 px-3 text-right">Current Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {c.address || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {currency}{(c.totalPurchases || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      {currency}{(c.totalPaid || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {c.currentDue > 0 ? (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {currency}{c.currentDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {currency}0
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Collect Payment Button */}
                        {c.currentDue > 0 && (
                          <button
                            onClick={() => {
                              setPaymentCustomer(c);
                              setCollectAmount(c.currentDue);
                            }}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                            title="Collect Due Payment"
                          >
                            Collect Due
                          </button>
                        )}

                        {/* WhatsApp Due Reminder */}
                        {c.currentDue > 0 && c.phone && (
                          <a
                            href={getWhatsAppReminderUrl(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg transition-colors"
                            title="Send WhatsApp Due Reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Customer Ledger Statement */}
                        <button
                          onClick={() => setLedgerCustomer(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="View Customer Ledger & Statement"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Delete */}
                        {permissions.canDeleteRecords && (
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">
              {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammad Ali"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01789637029"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Previous Opening Due Balance ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Collect Due Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Customer: <strong className="text-white">{paymentCustomer.name}</strong> • Current Due: {currency}{paymentCustomer.currentDue.toLocaleString()}
            </p>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Received Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentCustomer.currentDue}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deposit Into Account *
                </label>
                <select
                  value={collectAccountId}
                  onChange={(e) => setCollectAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) - Bal: {currency}{a.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reference / Note
                </label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g. Cash received at shop / bKash TrxID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Confirm & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Customer Statement Ledger</h3>
                <p className="text-xs text-slate-400">{ledgerCustomer.name} • Phone: {ledgerCustomer.phone}</p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs">
                <div>
                  <div className="text-slate-400">Total Billed</div>
                  <div className="font-bold text-white font-mono mt-0.5">{currency}{(ledgerCustomer.totalPurchases || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Total Paid</div>
                  <div className="font-bold text-emerald-400 font-mono mt-0.5">{currency}{(ledgerCustomer.totalPaid || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Current Due</div>
                  <div className="font-bold text-amber-400 font-mono mt-0.5">{currency}{ledgerCustomer.currentDue.toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-300 pt-2">Invoice Transaction History:</div>
              {sales.filter((s) => s.customerId === ledgerCustomer.id).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No sales invoices recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sales
                    .filter((s) => s.customerId === ledgerCustomer.id)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">Invoice #{s.invoiceNo}</div>
                          <div className="text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-white font-semibold">Total: {currency}{s.total.toLocaleString()}</div>
                          <div className="text-emerald-400 text-[11px]">Paid: {currency}{s.paidAmount.toLocaleString()}</div>
                          {s.dueAmount > 0 && <div className="text-amber-400 text-[11px]">Due: {currency}{s.dueAmount.toLocaleString()}</div>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
