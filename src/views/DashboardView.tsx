import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  Eye,
  Printer,
  ChevronRight,
  Receipt,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { Sale } from '../types';
import { QuickActionsFAB } from '../components/QuickActionsFAB';
import { SaleEntryModal } from '../components/SaleEntryModal';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onViewInvoice: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onViewInvoice }) => {
  const { currentBusiness } = useAuth();
  const { metrics, sales, purchases, expenses, products, stockMovements } = useBusiness();
  const currency = currentBusiness?.currency || '৳';

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Calculate 6 months sales and profit trend
  const salesChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    
    // Last 6 months labels
    const labels: string[] = [];
    const salesValues: number[] = [];
    const profitValues: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIndex - i + 12) % 12;
      labels.push(months[mIdx]);
      
      // Calculate real totals for this month
      let mSales = 0;
      let mProfit = 0;
      sales.forEach((s) => {
        const d = new Date(s.createdAt);
        if (d.getMonth() === mIdx) {
          mSales += s.total || 0;
          let cost = 0;
          s.items?.forEach((it) => (cost += (it.purchasePrice || 0) * (it.quantity || 0)));
          mProfit += (s.total || 0) - cost;
        }
      });
      salesValues.push(mSales);
      profitValues.push(mProfit);
    }

    return {
      labels,
      datasets: [
        {
          label: `Sales (${currency})`,
          data: salesValues,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 6,
        },
        {
          label: `Gross Profit (${currency})`,
          data: profitValues,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 6,
        },
      ],
    };
  }, [sales, currency]);

  // Expenses Breakdown by Category
  const expenseChartData = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    if (labels.length === 0) {
      return {
        labels: ['No Expenses Recorded'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#334155'],
          },
        ],
      };
    }

    const colors = [
      '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
        },
      ],
    };
  }, [expenses]);

  const recentSales = sales.slice(0, 5);
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockAlert).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Business Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {currentBusiness?.businessType || 'Business Dashboard'}
            </span>
            <span className="text-xs text-slate-400">Fiscal Year: {currentBusiness?.financialYear || '2026-2027'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {currentBusiness?.name}
          </h1>
          <p className="text-xs text-slate-400">
            Welcome back, {currentBusiness?.ownerName}. Here is your live business financial performance.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale</span>
          </button>
          <button
            onClick={() => onNavigate('purchases')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>New Purchase</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-slate-400">Total Sales</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {currency}{metrics.totalSales.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-3">
            <span className="text-slate-400">Today's Sales:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {currency}{metrics.todaySales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-slate-400">Net Business Profit</div>
              <div className={`text-2xl font-black mt-1 font-mono ${metrics.netProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {currency}{metrics.netProfit.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-3">
            <span className="text-slate-400">Gross Profit:</span>
            <span className="font-bold text-slate-200 font-mono">
              {currency}{metrics.grossProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Purchases Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-slate-400">Total Purchases</div>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                {currency}{metrics.totalPurchases.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-3">
            <span className="text-slate-400">Total Expenses:</span>
            <span className="font-bold text-amber-400 font-mono">
              {currency}{metrics.totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Receivables & Dues Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-slate-400">Customer Dues (Receivable)</div>
              <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                {currency}{metrics.totalReceivables.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-3">
            <span className="text-slate-400">Supplier Payables:</span>
            <span className="font-bold text-rose-400 font-mono">
              {currency}{metrics.totalPayables.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Liquidity & Inventory Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Cash in Hand</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {currency}{metrics.cashBalance.toLocaleString()}
            </div>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-semibold">Cash</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Bank & MFS Balance</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {currency}{(metrics.bankBalance + metrics.mfsBalance).toLocaleString()}
            </div>
          </div>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-lg font-semibold">Bank/bKash</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Total Products</div>
            <div className="text-lg font-bold text-white font-mono">
              {metrics.totalProducts} items
            </div>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-semibold">Catalog</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Stock Valuation (Cost)</div>
            <div className="text-lg font-bold text-indigo-400 font-mono">
              {currency}{metrics.inventoryValue.toLocaleString()}
            </div>
          </div>
          <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg font-semibold">Assets</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales & Profit Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Sales & Gross Profit</h3>
              <p className="text-xs text-slate-400">Performance overview across the past 6 months</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>Full Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72">
            <Bar
              data={salesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { color: '#94a3b8', font: { size: 11 } },
                  },
                },
                scales: {
                  x: { ticks: { color: '#64748b' }, grid: { display: false } },
                  y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51, 65, 85, 0.4)' } },
                },
              }}
            />
          </div>
        </div>

        {/* Expense Breakdown Doughnut */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Expense Breakdown</h3>
                <p className="text-xs text-slate-400">Total: {currency}{metrics.totalExpenses.toLocaleString()}</p>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Manage
              </button>
            </div>

            <div className="h-48 relative flex items-center justify-center my-4">
              <Doughnut
                data={expenseChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 text-center">
            <button
              onClick={() => onNavigate('expenses')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              + Record Business Expense
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alert & Recent Sales Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Notifications */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">Low-Stock Alerts</h3>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full">
              {metrics.lowStockCount} Items
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p>All product inventory levels are currently healthy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{prod.name}</div>
                    <div className="text-[11px] text-slate-400">
                      SKU: {prod.sku} • Alert limit: {prod.minStockAlert} {prod.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-rose-400 font-mono">
                      {prod.currentStock} {prod.unit} left
                    </div>
                    <button
                      onClick={() => onNavigate('purchases')}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold mt-0.5 block"
                    >
                      Restock Bill →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 text-right">
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-slate-400 hover:text-white font-semibold inline-flex items-center space-x-1"
            >
              <span>View full inventory catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-white">Recent Sales Invoices</h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              All Invoices ({sales.length})
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <p>No sales recorded yet. Click below to create your first invoice.</p>
              <button
                onClick={() => onNavigate('sales')}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5">Invoice #</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5 text-right">Total</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-mono font-bold text-white">{s.invoiceNo}</td>
                      <td className="py-3">
                        <div className="text-slate-200 font-medium">{s.customerName}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-100">
                        {currency}{s.total.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        {s.dueAmount <= 0 ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        ) : s.paidAmount > 0 ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                            Partial ({currency}{s.dueAmount})
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full">
                            Due
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onViewInvoice(s)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                          title="View & Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Actions Speed Dial */}
      <QuickActionsFAB onViewInvoice={onViewInvoice} onNavigate={onNavigate} />

      {/* Direct Sale Entry Modal from Dashboard Header */}
      <SaleEntryModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaleCompleted={(sale) => {
          setIsSaleModalOpen(false);
          onViewInvoice(sale);
        }}
      />
    </div>
  );
};
