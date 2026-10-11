import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Truck,
  Landmark,
  Receipt,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Settings,
  HelpCircle,
  MessageCircle,
  Phone
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSupport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
  onOpenSupport,
}) => {
  const { metrics } = useBusiness();
  const { currentBusiness, permissions } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sales',
      label: 'Sales & POS',
      icon: ShoppingCart,
      badge: null,
      visible: permissions.canCreateSales,
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: ShoppingBag,
      badge: null,
      visible: permissions.canCreatePurchases,
    },
    {
      id: 'products',
      label: 'Inventory & Items',
      icon: Package,
      badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Low` : null,
      badgeColor: 'bg-rose-500 text-white',
      visible: permissions.canManageInventory,
    },
    {
      id: 'customers',
      label: 'Customers & Dues',
      icon: Users,
      badge: null,
    },
    {
      id: 'suppliers',
      label: 'Suppliers & Payables',
      icon: Truck,
      badge: null,
    },
    {
      id: 'accounts',
      label: 'Accounts & Banking',
      icon: Landmark,
      badge: null,
      visible: permissions.canManageFinance,
    },
    {
      id: 'expenses',
      label: 'Expenses & Income',
      icon: Receipt,
      badge: null,
      visible: permissions.canManageFinance,
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: BarChart3,
      badge: null,
      visible: permissions.canManageFinance,
    },
    {
      id: 'members',
      label: 'Staff & Roles',
      icon: UserCheck,
      badge: null,
      visible: permissions.canManageEmployees,
    },
    {
      id: 'audit',
      label: 'Security & Audit',
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Business Settings',
      icon: Settings,
      badge: null,
      visible: permissions.canManageSettings,
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 bottom-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out h-[calc(100vh-4rem)] overflow-y-auto ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-3 space-y-1">
          {navItems
            .filter((item) => item.visible !== false)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.badgeColor || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Support Section at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/40 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>DMS Solution Support</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Owner: <strong className="text-white">DIL Mohammad Sohel</strong>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono font-medium">
              WhatsApp: 01789637029
            </div>

            <div className="mt-2.5 flex items-center space-x-1.5">
              <a
                href="https://wa.me/01789637029"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg text-center transition-colors shadow-sm inline-flex items-center justify-center space-x-1"
              >
                <span>WhatsApp</span>
              </a>
              <button
                onClick={onOpenSupport}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium py-1.5 px-2.5 rounded-lg transition-colors"
                title="Support Details"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center">
            {currentBusiness ? `${currentBusiness.name} • ` : ''}v2.4 Production
          </div>
        </div>
      </aside>
    </>
  );
};
