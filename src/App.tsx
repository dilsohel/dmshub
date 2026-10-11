/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SupportBanner, SupportModal } from './components/SupportModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AuthView } from './views/AuthView';
import { BusinessSetupWizard } from './views/BusinessSetupWizard';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { SalesView } from './views/SalesView';
import { PurchasesView } from './views/PurchasesView';
import { CustomersView } from './views/CustomersView';
import { SuppliersView } from './views/SuppliersView';
import { AccountsView } from './views/AccountsView';
import { ExpensesView } from './views/ExpensesView';
import { ReportsView } from './views/ReportsView';
import { MembersView } from './views/MembersView';
import { AuditLogsView } from './views/AuditLogsView';
import { SettingsView } from './views/SettingsView';
import { Purchase, Sale } from './types';

const MainAppContent: React.FC = () => {
  const { user, currentBusiness, businesses, loading } = useAuth();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRegisterBusinessModalOpen, setIsRegisterBusinessModalOpen] = useState(false);

  // Invoice Print Preview Modal State
  const [activePrintSale, setActivePrintSale] = useState<Sale | null>(null);
  const [activePrintPurchase, setActivePrintPurchase] = useState<Purchase | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-xl animate-pulse">
          DMS
        </div>
        <div className="text-sm font-semibold tracking-wide text-slate-300">
          Loading DMS Solution...
        </div>
      </div>
    );
  }

  // If user is not authenticated -> AuthView
  if (!user) {
    return (
      <>
        <AuthView onOpenSupport={() => setIsSupportOpen(true)} />
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      </>
    );
  }

  // If user has no registered business yet -> Guided Wizard
  if (businesses.length === 0 || !currentBusiness) {
    return (
      <>
        <BusinessSetupWizard
          isFirstBusiness={true}
          onOpenSupport={() => setIsSupportOpen(true)}
        />
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      </>
    );
  }

  return (
    <BusinessProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        {/* Support Banner at Top */}
        <SupportBanner />

        {/* Global Navbar */}
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenSupport={() => setIsSupportOpen(true)}
          onOpenNewBusinessModal={() => setIsRegisterBusinessModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Layout Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            onOpenSupport={() => setIsSupportOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-6rem)]">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={(v) => setCurrentView(v)}
                onViewInvoice={(s) => {
                  setActivePrintSale(s);
                  setActivePrintPurchase(null);
                }}
              />
            )}

            {currentView === 'sales' && (
              <SalesView
                onViewInvoice={(s) => {
                  setActivePrintSale(s);
                  setActivePrintPurchase(null);
                }}
              />
            )}

            {currentView === 'purchases' && (
              <PurchasesView
                onViewBill={(p) => {
                  setActivePrintPurchase(p);
                  setActivePrintSale(null);
                }}
              />
            )}

            {currentView === 'products' && <ProductsView />}
            {currentView === 'customers' && <CustomersView />}
            {currentView === 'suppliers' && <SuppliersView />}
            {currentView === 'accounts' && <AccountsView />}
            {currentView === 'expenses' && <ExpensesView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'members' && <MembersView />}
            {currentView === 'audit' && <AuditLogsView />}
            {currentView === 'settings' && (
              <SettingsView onOpenSupport={() => setIsSupportOpen(true)} />
            )}
          </main>
        </div>

        {/* Modals */}
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

        <InvoicePrintModal
          isOpen={!!activePrintSale || !!activePrintPurchase}
          onClose={() => {
            setActivePrintSale(null);
            setActivePrintPurchase(null);
          }}
          business={currentBusiness}
          sale={activePrintSale}
          purchase={activePrintPurchase}
        />

        {/* Register Additional Business Modal */}
        {isRegisterBusinessModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4">
            <BusinessSetupWizard
              isFirstBusiness={false}
              onCancel={() => setIsRegisterBusinessModalOpen(false)}
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          </div>
        )}
      </div>
    </BusinessProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
