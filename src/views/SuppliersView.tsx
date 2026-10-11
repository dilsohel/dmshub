import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  DollarSign,
  FileText,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Supplier } from '../types';

export const SuppliersView: React.FC = () => {
  const { currentBusiness, permissions } = useAuth();
  const {
    suppliers,
    accounts,
    purchases,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    paySupplier
  } = useBusiness();

  const currency = currentBusiness?.currency || '৳';

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Payment states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id || '');
  const [payNotes, setPayNotes] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.toLowerCase().includes(search.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [suppliers, search]);

  const totalPayables = suppliers.reduce((sum, s) => sum + (s.currentDue || 0), 0);
  const totalPurchasedFromSuppliers = suppliers.reduce((sum, s) => sum + (s.totalPurchased || 0), 0);

  const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setOpeningBalance(0);
    setEditingSupplier(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setOpeningBalance(s.openingBalance || 0);
    setIsAddModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      await addSupplier({
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

  const handlePaySupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSupplier || payAmount <= 0) return;
    await paySupplier(
      paymentSupplier.id,
      payAmount,
      payAccountId,
      payNotes.trim() || undefined
    );
    setPaymentSupplier(null);
    setPayAmount(0);
    setPayNotes('');
  };

  const handleDelete = async (s: Supplier) => {
    if (confirm(`Are you sure you want to delete supplier "${s.name}"?`)) {
      await deleteSupplier(s.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Suppliers & Payables</h1>
          <p className="text-xs text-slate-400">
            Manage your vendors, wholesale suppliers, purchase ledgers, and pay dues.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-cyan-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Registered Suppliers</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {suppliers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Payables Due</div>
            <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
              {currency}{totalPayables.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Sourced Volume</div>
            <div className="text-2xl font-black text-teal-400 mt-0.5 font-mono">
              {currency}{totalPurchasedFromSuppliers.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, phone, or address..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No suppliers found. Click "+ Add New Supplier" above to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Supplier & Phone</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-right">Total Purchased</th>
                  <th className="py-3 px-3 text-right">Total Paid</th>
                  <th className="py-3 px-3 text-right">Outstanding Payable</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{s.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {s.address || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-300">
                      {currency}{(s.totalPurchased || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                      {currency}{(s.totalPaid || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {s.currentDue > 0 ? (
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          {currency}{s.currentDue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">{currency}0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Pay Supplier Button */}
                        {s.currentDue > 0 && (
                          <button
                            onClick={() => {
                              setPaymentSupplier(s);
                              setPayAmount(s.currentDue);
                            }}
                            className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                            title="Pay Supplier"
                          >
                            Pay Due
                          </button>
                        )}

                        {/* Statement */}
                        <button
                          onClick={() => setLedgerSupplier(s)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="View Supplier Ledger & Statement"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Delete */}
                        {permissions.canDeleteRecords && (
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete Supplier"
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

      {/* Add / Edit Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">
              {editingSupplier ? 'Edit Supplier Details' : 'Add New Supplier'}
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meghna Wholesale Ltd."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
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
                  placeholder="e.g. Khatungonj, Chittagong"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {!editingSupplier && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Opening Payable Due ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
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
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {paymentSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Make Payment to Supplier</h3>
            <p className="text-xs text-slate-400 mb-4">
              Supplier: <strong className="text-white">{paymentSupplier.name}</strong> • Outstanding Due: {currency}{paymentSupplier.currentDue.toLocaleString()}
            </p>

            <form onSubmit={handlePaySupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentSupplier.currentDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pay From Account *
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) - Balance: {currency}{a.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Voucher No.
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Check #4451 or Cash handover"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPaymentSupplier(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Confirm Supplier Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Ledger Statement Modal */}
      {ledgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Supplier Statement Ledger</h3>
                <p className="text-xs text-slate-400">{ledgerSupplier.name} • Phone: {ledgerSupplier.phone}</p>
              </div>
              <button
                onClick={() => setLedgerSupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs">
                <div>
                  <div className="text-slate-400">Total Sourced</div>
                  <div className="font-bold text-white font-mono mt-0.5">{currency}{(ledgerSupplier.totalPurchased || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Total Paid</div>
                  <div className="font-bold text-emerald-400 font-mono mt-0.5">{currency}{(ledgerSupplier.totalPaid || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Outstanding Due</div>
                  <div className="font-bold text-rose-400 font-mono mt-0.5">{currency}{ledgerSupplier.currentDue.toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-300 pt-2">Purchase Bills History:</div>
              {purchases.filter((p) => p.supplierId === ledgerSupplier.id).length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No purchases recorded from this vendor yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {purchases
                    .filter((p) => p.supplierId === ledgerSupplier.id)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">Bill #{p.invoiceNo}</div>
                          <div className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-white font-semibold">Total: {currency}{p.total.toLocaleString()}</div>
                          <div className="text-emerald-400 text-[11px]">Paid: {currency}{p.paidAmount.toLocaleString()}</div>
                          {p.dueAmount > 0 && <div className="text-rose-400 text-[11px]">Due: {currency}{p.dueAmount.toLocaleString()}</div>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setLedgerSupplier(null)}
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
