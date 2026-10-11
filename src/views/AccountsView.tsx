import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  DollarSign,
  Smartphone,
  Wallet,
  Building,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Account } from '../types';

export const AccountsView: React.FC = () => {
  const { currentBusiness, permissions } = useAuth();
  const { accounts, addAccount, transferFunds } = useBusiness();
  const currency = currentBusiness?.currency || '৳';

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Account states
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('cash');
  const [balance, setBalance] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  // Transfer states
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  const totalLiquidity = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalCash = accounts.filter((a) => a.type === 'cash').reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalBank = accounts.filter((a) => a.type === 'bank').reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalMfs = accounts.filter((a) => a.type === 'mfs').reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addAccount({
      name: name.trim(),
      type,
      balance: Number(balance) || 0,
      accountNumber: accountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      isDefault: false,
    });

    setIsAddAccountModalOpen(false);
    setName('');
    setAccountNumber('');
    setBankName('');
    setBalance(0);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    if (fromAccountId === toAccountId) {
      setTransferError('Cannot transfer to the same account');
      return;
    }
    if (transferAmount <= 0) {
      setTransferError('Enter a valid transfer amount');
      return;
    }

    try {
      await transferFunds(fromAccountId, toAccountId, transferAmount, transferNotes.trim());
      setIsTransferModalOpen(false);
      setTransferAmount(0);
      setTransferNotes('');
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Accounts & Finance</h1>
          <p className="text-xs text-slate-400">
            Cashbooks, bank books, mobile wallets (bKash/Nagad), and fund transfers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {permissions.canManageFinance && (
            <>
              <button
                onClick={() => {
                  setFromAccountId(accounts[0]?.id || '');
                  setToAccountId(accounts[1]?.id || '');
                  setTransferError(null);
                  setIsTransferModalOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span>Transfer Funds</span>
              </button>

              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Liquidity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Liquid Assets</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {currency}{totalLiquidity.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Cash in Hand</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              {currency}{totalCash.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Bank Accounts</div>
            <div className="text-2xl font-black text-cyan-400 mt-0.5 font-mono">
              {currency}{totalBank.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">MFS (bKash/Nagad)</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5 font-mono">
              {currency}{totalMfs.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isCash = acc.type === 'cash';
          const isBank = acc.type === 'bank';
          const isMfs = acc.type === 'mfs';

          return (
            <div
              key={acc.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isCash
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isBank
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {isCash ? (
                        <Wallet className="w-5 h-5" />
                      ) : isBank ? (
                        <Building className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{acc.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {acc.type === 'mfs' ? 'Mobile Financial Service' : acc.type}
                      </span>
                    </div>
                  </div>
                  {acc.isDefault && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400">Available Balance</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">
                    {currency}{acc.balance.toLocaleString()}
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-400">
                  {acc.bankName && <div>Bank: <strong className="text-slate-300">{acc.bankName}</strong></div>}
                  {acc.accountNumber && (
                    <div className="font-mono">Account / Wallet #: <span className="text-slate-300">{acc.accountNumber}</span></div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-500">Active</span>
                <button
                  onClick={() => {
                    setFromAccountId(acc.id);
                    setToAccountId(accounts.find((a) => a.id !== acc.id)?.id || '');
                    setTransferError(null);
                    setIsTransferModalOpen(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Transfer from here →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-4">Add Financial Account</h3>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BRAC Bank Corporate / bKash Agent"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Cash (Counter Cash in Hand)</option>
                  <option value="bank">Bank Account</option>
                  <option value="mfs">Mobile Financial Service (bKash / Nagad / Rocket)</option>
                </select>
              </div>

              {type === 'bank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Islami Bank Bangladesh / City Bank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account / Mobile Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 20501234567 or 01789637029"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial / Opening Balance ({currency})
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Account Fund Transfer</h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfer funds between internal cash, bank, or MFS accounts.
            </p>

            {transferError && (
              <div className="mb-3 p-2.5 bg-rose-500/20 text-rose-300 text-xs rounded-xl border border-rose-500/30">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  From Source Account *
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Balance: {currency}{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  To Destination Account *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Balance: {currency}{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transfer Amount ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transfer Purpose / Notes
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Deposited cash to bank, cash withdrawal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
