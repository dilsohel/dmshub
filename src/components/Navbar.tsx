import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Plus,
  HelpCircle,
  LogOut,
  User,
  ShoppingBag,
  ShoppingCart,
  Package,
  UserPlus,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

interface NavbarProps {
  onOpenSupport: () => void;
  onNavigate: (view: string) => void;
  onOpenNewBusinessModal: () => void;
  onToggleMobileSidebar: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSupport,
  onNavigate,
  onOpenNewBusinessModal,
  onToggleMobileSidebar,
}) => {
  const { user, userProfile, businesses, currentBusiness, switchBusiness, signOutUser, currentRole } = useAuth();
  const { metrics } = useBusiness();
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md group-hover:scale-105 transition-transform">
              DMS
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  DMS Solution
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Complete Business Management Platform</p>
            </div>
          </div>

          {/* Business Selector */}
          {currentBusiness && (
            <div className="relative ml-4 pl-4 border-l border-slate-800 hidden md:block">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700/60 transition-all text-xs font-medium"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span className="max-w-[150px] truncate font-semibold text-white">
                  {currentBusiness.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showBusinessDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Your Businesses
                  </div>
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        switchBusiness(b.id);
                        setShowBusinessDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700/70 transition-colors ${
                        b.id === currentBusiness.id ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <div>{b.name}</div>
                        <div className="text-[10px] text-slate-400">{b.businessType || 'General'}</div>
                      </div>
                      {b.id === currentBusiness.id && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  ))}
                  <div className="border-t border-slate-700 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowBusinessDropdown(false);
                        onOpenNewBusinessModal();
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-slate-700 flex items-center space-x-2 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register New Business</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick actions, Support & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-xl font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-all"
              title="Quick Action"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Action</span>
            </button>

            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('sales');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center space-x-2.5 text-slate-200"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  <span>Create Sale Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('purchases');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center space-x-2.5 text-slate-200"
                >
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <span>Record Purchase Bill</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('products');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center space-x-2.5 text-slate-200"
                >
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Add New Product</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('customers');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center space-x-2.5 text-slate-200"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Add Customer</span>
                </button>
              </div>
            )}
          </div>

          {/* Support WhatsApp Button */}
          <button
            onClick={onOpenSupport}
            className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            title="DMS Solution Support"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Support: 01789637029</span>
            <span className="md:hidden">Support</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase border border-slate-700">
                {userProfile?.displayName ? userProfile.displayName.substring(0, 2) : 'US'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {userProfile?.displayName || user?.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 capitalize">{currentRole}</div>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-700">
                  <div className="font-semibold text-white truncate">
                    {userProfile?.displayName || 'DMS User'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded capitalize">
                      Role: {currentRole}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Business Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenSupport();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 flex items-center space-x-2"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Help & Contact Support</span>
                </button>

                <div className="border-t border-slate-700 my-1"></div>

                <button
                  onClick={async () => {
                    setShowUserDropdown(false);
                    await signOutUser();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
