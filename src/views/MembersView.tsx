import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Trash2,
  Mail,
  User,
  Key,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { UserRole } from '../types';

export const MembersView: React.FC = () => {
  const { currentBusiness, permissions } = useAuth();
  const { members, addMember, removeMember } = useBusiness();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('salesperson');

  const roleDefinitions: Record<UserRole, { title: string; desc: string; access: string }> = {
    owner: {
      title: 'Business Owner',
      desc: 'Complete full authority over all operations, settings, staff, and financial data.',
      access: 'All modules & settings',
    },
    admin: {
      title: 'Administrator',
      desc: 'Can manage products, sales, purchases, staff, and business accounts.',
      access: 'Operations, Finance, Staff',
    },
    manager: {
      title: 'Store Manager',
      desc: 'Oversees daily sales, purchases, inventory restock, and customer accounts.',
      access: 'Sales, Purchases, Inventory, CRM',
    },
    salesperson: {
      title: 'Salesperson / Counter POS',
      desc: 'Creates sales invoices, registers walk-in customers, prints receipts.',
      access: 'Sales & POS only',
    },
    accountant: {
      title: 'Accountant',
      desc: 'Manages ledger, expenses, cashbooks, customer receipts, and profit statements.',
      access: 'Finance, Ledgers, Reports',
    },
    inventory_manager: {
      title: 'Inventory Manager',
      desc: 'Handles stock checks, purchase orders from suppliers, and damaged goods.',
      access: 'Inventory, Stock, Purchases',
    },
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) return;

    await addMember(email.trim(), displayName.trim(), role);
    setIsAddModalOpen(false);
    setEmail('');
    setDisplayName('');
    setRole('salesperson');
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (confirm(`Revoke access for employee "${name}"?`)) {
      await removeMember(memberId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Staff & Employee Permissions</h1>
          <p className="text-xs text-slate-400">
            Control which modules and sensitive financial records each employee can view or modify.
          </p>
        </div>

        {permissions.canManageEmployees && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Staff Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Owner Card (Always Present) */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {currentBusiness?.ownerName}
                </h3>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Business Owner
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
              Full Access
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            Primary business owner with unrestricted permissions across finance, billing, and settings.
          </p>
        </div>

        {/* Invited / Created Members */}
        {members.map((mem) => {
          const roleInfo = roleDefinitions[mem.role] || roleDefinitions.salesperson;
          return (
            <div
              key={mem.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm">
                      {mem.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {mem.displayName}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {mem.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full capitalize">
                    {mem.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="font-semibold text-slate-300">{roleInfo.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{roleInfo.desc}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-500">
                  Added {new Date(mem.createdAt).toLocaleDateString()}
                </span>
                {permissions.canManageEmployees && (
                  <button
                    onClick={() => handleRemove(mem.id, mem.displayName)}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="font-bold text-base text-white mb-2">Role Access Control Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">
          Visual summary of modules enabled for each assigned employee role.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5">Role</th>
                <th className="py-2.5 text-center">POS / Sales</th>
                <th className="py-2.5 text-center">Purchases</th>
                <th className="py-2.5 text-center">Inventory Stock</th>
                <th className="py-2.5 text-center">Accounting & Banking</th>
                <th className="py-2.5 text-center">Reports</th>
                <th className="py-2.5 text-center">Settings & Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 font-bold text-white">Owner / Admin</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-200">Store Manager</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-slate-600">—</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-200">Accountant</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-slate-600">—</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-200">Salesperson / POS</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-slate-200">Inventory Manager</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-emerald-400">✓</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-slate-600">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-4">Add Staff Member Account</h3>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Employee Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tanvir@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Staff Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="salesperson">Salesperson / Counter POS</option>
                  <option value="manager">Store Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Selected Role Scope:</span>{' '}
                {roleDefinitions[role].desc}
              </div>

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
                  Save & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
