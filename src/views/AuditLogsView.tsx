import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Lock,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useBusiness();
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [search, setSearch] = useState('');

  const modules = ['Sales', 'Purchases', 'Inventory', 'Customers', 'Suppliers', 'Finance', 'Employees', 'Settings'];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchMod = selectedModule === 'ALL' || log.module === selectedModule;
      const matchSearch =
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.actorName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());
      return matchMod && matchSearch;
    });
  }, [auditLogs, selectedModule, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Security & Audit Trails</h1>
          <p className="text-xs text-slate-400">
            Immutable, append-only logs tracking who created sales, updated stock, deleted records, or logged in.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Immutable Ledger Enforced</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, or details..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Modules ({auditLogs.length})</option>
          {modules.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p>No activity logs recorded yet matching your query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {log.module.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{log.action.replace('_', ' ')}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                        {log.module}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 leading-relaxed">{log.details}</p>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Actor: <strong className="text-slate-400">{log.actorName}</strong></span>
                      </span>
                      {log.recordId && <span>• ID: <span className="font-mono text-slate-400">{log.recordId}</span></span>}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono shrink-0 sm:self-center">
                  <div className="flex items-center space-x-1 sm:justify-end">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
