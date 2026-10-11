import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  Scale,
  Receipt,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

export const ReportsView: React.FC = () => {
  const { currentBusiness } = useAuth();
  const {
    sales,
    purchases,
    expenses,
    products,
    customers,
    suppliers,
    accounts,
    metrics
  } = useBusiness();

  const currency = currentBusiness?.currency || '৳';

  const [reportType, setReportType] = useState<'PL' | 'BALANCE' | 'SALES' | 'PURCHASES' | 'STOCK' | 'DUES'>('PL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'MONTH' | 'YEAR'>('MONTH');

  // Filter items by time range
  const filteredSales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const currentYear = today.substring(0, 4);

    return sales.filter((s) => {
      if (timeFilter === 'TODAY') return s.createdAt.startsWith(today);
      if (timeFilter === 'MONTH') return s.createdAt.startsWith(currentMonth);
      if (timeFilter === 'YEAR') return s.createdAt.startsWith(currentYear);
      return true;
    });
  }, [sales, timeFilter]);

  const filteredPurchases = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const currentYear = today.substring(0, 4);

    return purchases.filter((p) => {
      if (timeFilter === 'TODAY') return p.createdAt.startsWith(today);
      if (timeFilter === 'MONTH') return p.createdAt.startsWith(currentMonth);
      if (timeFilter === 'YEAR') return p.createdAt.startsWith(currentYear);
      return true;
    });
  }, [purchases, timeFilter]);

  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    const currentYear = today.substring(0, 4);

    return expenses.filter((e) => {
      if (timeFilter === 'TODAY') return e.date === today;
      if (timeFilter === 'MONTH') return e.date.startsWith(currentMonth);
      if (timeFilter === 'YEAR') return e.date.startsWith(currentYear);
      return true;
    });
  }, [expenses, timeFilter]);

  // Dynamic P&L Calculations for the filtered range
  const plStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    let cogs = 0;
    filteredSales.forEach((s) => {
      s.items?.forEach((it) => {
        cogs += (it.purchasePrice || 0) * (it.quantity || 0);
      });
    });
    const grossProfit = totalRevenue - cogs;
    const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExp;

    return { totalRevenue, cogs, grossProfit, totalExp, netProfit };
  }, [filteredSales, filteredExpenses]);

  // Balance Sheet Totals
  const totalAssets = metrics.cashBalance + metrics.bankBalance + metrics.mfsBalance + metrics.totalReceivables + metrics.inventoryValue;
  const totalLiabilities = metrics.totalPayables;
  const equity = totalAssets - totalLiabilities;

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'PL') {
      csvContent += "Profit and Loss Statement\n";
      csvContent += `Business,${currentBusiness?.name}\n`;
      csvContent += `Period,${timeFilter}\n\n`;
      csvContent += `Metric,Amount (${currency})\n`;
      csvContent += `Total Sales Revenue,${plStats.totalRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),${plStats.cogs}\n`;
      csvContent += `Gross Profit,${plStats.grossProfit}\n`;
      csvContent += `Operating Expenses,${plStats.totalExp}\n`;
      csvContent += `Net Profit,${plStats.netProfit}\n`;
    } else if (reportType === 'SALES') {
      csvContent += "Invoice No,Date,Customer,Total,Paid,Due,Status\n";
      filteredSales.forEach((s) => {
        csvContent += `"${s.invoiceNo}","${s.createdAt.split('T')[0]}","${s.customerName}",${s.total},${s.paidAmount},${s.dueAmount},"${s.status}"\n`;
      });
    } else if (reportType === 'STOCK') {
      csvContent += "Product,SKU,Category,Current Stock,Unit,Purchase Cost,Selling Price,Total Valuation\n";
      products.forEach((p) => {
        csvContent += `"${p.name}","${p.sku}","${p.category}",${p.currentStock},"${p.unit}",${p.purchasePrice},${p.sellingPrice},${p.currentStock * p.purchasePrice}\n`;
      });
    } else if (reportType === 'DUES') {
      csvContent += "Customer,Phone,Address,Total Purchases,Total Paid,Current Due\n";
      customers.forEach((c) => {
        csvContent += `"${c.name}","${c.phone}","${c.address || ''}",${c.totalPurchases},${c.totalPaid},${c.currentDue}\n`;
      });
    } else {
      csvContent += "Account / Item,Category,Amount\n";
      csvContent += `Total Assets,Assets,${totalAssets}\n`;
      csvContent += `Total Liabilities,Liabilities,${totalLiabilities}\n`;
      csvContent += `Owner Equity,Equity,${equity}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DMS_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-400">
            Real-time balance sheet, profit and loss statements, sales reports, and CSV data exports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Reports */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl overflow-x-auto text-xs">
          {[
            { id: 'PL', label: 'Profit & Loss' },
            { id: 'BALANCE', label: 'Balance Sheet' },
            { id: 'SALES', label: 'Sales Report' },
            { id: 'STOCK', label: 'Stock Valuation' },
            { id: 'DUES', label: 'Customer Dues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                reportType === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Filter Pills */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'MONTH', label: 'This Month' },
            { id: 'YEAR', label: 'This Year' },
            { id: 'ALL', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                timeFilter === t.id ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT CONTENT BODY */}
      {reportType === 'PL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center">
            <h2 className="text-xl font-bold text-white">Profit & Loss Statement</h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentBusiness?.name} • Period: {timeFilter === 'TODAY' ? 'Today' : timeFilter === 'MONTH' ? 'Current Month' : timeFilter === 'YEAR' ? 'Fiscal Year' : 'All Time'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">1. Operating Revenue</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Total Sales Gross Inflow:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currency}{plStats.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">2. Cost of Goods Sold (COGS)</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Cost of Inventory Sold:</span>
                <span className="font-mono font-bold text-rose-400">
                  -{currency}{plStats.cogs.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 text-sm font-bold">
              <span className="text-white">Gross Profit:</span>
              <span className={`font-mono text-base ${plStats.grossProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {currency}{plStats.grossProfit.toLocaleString()}
              </span>
            </div>

            {/* Expenses */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">3. Operating Overhead Expenses</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Shop Rent, Bills & Misc Expenses:</span>
                <span className="font-mono font-bold text-rose-400">
                  -{currency}{plStats.totalExp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-950/60 to-slate-900 rounded-2xl border border-emerald-500/40 text-base font-extrabold shadow-lg">
              <span className="text-white">Net Business Profit (Bottom Line):</span>
              <span className={`font-mono text-xl ${plStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currency}{plStats.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'BALANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center">
            <h2 className="text-xl font-bold text-white">Statement of Financial Position (Balance Sheet)</h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentBusiness?.name} • As of {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-bold text-emerald-400 uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                Assets (What the Business Owns)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Cash in Hand:</span>
                  <span className="font-mono font-semibold">{currency}{metrics.cashBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Bank Account Balances:</span>
                  <span className="font-mono font-semibold">{currency}{metrics.bankBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>bKash / Nagad MFS Balances:</span>
                  <span className="font-mono font-semibold">{currency}{metrics.mfsBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Accounts Receivable (Customer Dues):</span>
                  <span className="font-mono font-semibold">{currency}{metrics.totalReceivables.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Current Inventory Stock (Cost):</span>
                  <span className="font-mono font-semibold">{currency}{metrics.inventoryValue.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-bold text-emerald-400">
                <span>Total Assets:</span>
                <span className="font-mono">{currency}{totalAssets.toLocaleString()}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <div className="font-bold text-rose-400 uppercase tracking-wider text-xs border-b border-slate-800 pb-2 mb-3">
                  Liabilities (What the Business Owes)
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Accounts Payable (Supplier Dues):</span>
                  <span className="font-mono font-semibold text-rose-400">{currency}{totalLiabilities.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="font-bold text-teal-400 uppercase tracking-wider text-xs border-b border-slate-800 pb-2 mb-3">
                  Owner's Capital & Retained Earnings
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Net Equity:</span>
                  <span className="font-mono font-semibold text-teal-400">{currency}{equity.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-bold text-white">
                <span>Total Liabilities + Equity:</span>
                <span className="font-mono">{currency}{(totalLiabilities + equity).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'SALES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-white">{filteredSales.length} Sales in Selected Range</span>
            <span className="font-mono text-emerald-400 font-bold">
              Total: {currency}{filteredSales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Items</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-white">{s.invoiceNo}</td>
                    <td className="py-3 px-3 text-slate-400">{s.createdAt.split('T')[0]}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{s.customerName}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{s.items?.length || 0}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">{currency}{s.total.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">{currency}{s.paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400">{currency}{s.dueAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'STOCK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-white">{products.length} Products in Inventory</span>
            <span className="font-mono text-emerald-400 font-bold">
              Total Stock Valuation: {currency}{metrics.inventoryValue.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-3 px-3 text-slate-300">{p.category}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">{p.currentStock} {p.unit}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">{currency}{p.purchasePrice}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">{currency}{p.sellingPrice}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-teal-400">
                      {currency}{(p.currentStock * p.purchasePrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'DUES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-white">Outstanding Customer Receivables</span>
            <span className="font-mono text-amber-400 font-bold">
              Total Dues: {currency}{metrics.totalReceivables.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Total Paid</th>
                  <th className="py-3 px-3 text-right">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers
                  .filter((c) => c.currentDue > 0)
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-3 text-slate-400">{c.phone}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{currency}{(c.totalPurchases || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">{currency}{(c.totalPaid || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                        {currency}{c.currentDue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
