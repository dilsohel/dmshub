import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Save,
  Download,
  ShieldCheck,
  Phone,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Database,
  ExternalLink,
  CheckCircle2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { uploadFileToStorage } from '../lib/firebase';

interface SettingsViewProps {
  onOpenSupport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenSupport }) => {
  const { currentBusiness, updateBusinessProfile, userProfile } = useAuth();
  const { products, customers, suppliers, sales, purchases, accounts, expenses, stockMovements } = useBusiness();

  // Form states
  const [name, setName] = useState(currentBusiness?.name || '');
  const [ownerName, setOwnerName] = useState(currentBusiness?.ownerName || '');
  const [businessType, setBusinessType] = useState(currentBusiness?.businessType || 'Retailer & Shopkeeper');
  const [address, setAddress] = useState(currentBusiness?.address || '');
  const [phone, setPhone] = useState(currentBusiness?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentBusiness?.whatsapp || '');
  const [email, setEmail] = useState(currentBusiness?.email || '');
  const [currency, setCurrency] = useState(currentBusiness?.currency || '৳');
  const [invoicePrefix, setInvoicePrefix] = useState(currentBusiness?.invoicePrefix || 'DMS-');
  const [financialYear, setFinancialYear] = useState(currentBusiness?.financialYear || '2026-2027');
  const [logoUrl, setLogoUrl] = useState(currentBusiness?.logoUrl || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBusiness) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `businesses/${currentBusiness.id}/logos/logo_${Date.now()}.${ext}`;
      const downloadUrl = await uploadFileToStorage(file, path);
      setLogoUrl(downloadUrl);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo image: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatePayload: any = {
        name: name.trim(),
        ownerName: ownerName.trim(),
        businessType,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        currency,
        invoicePrefix: invoicePrefix.trim().toUpperCase() || 'DMS-',
        financialYear,
      };
      if (logoUrl.trim()) {
        updatePayload.logoUrl = logoUrl.trim();
      }
      await updateBusinessProfile(updatePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      business: currentBusiness,
      data: {
        products,
        customers,
        suppliers,
        sales,
        purchases,
        accounts,
        expenses,
        stockMovements,
      },
      metadata: {
        platform: 'DMS Solution SaaS',
        version: '2.4.0',
        owner: 'DIL Mohammad Sohel',
        supportWhatsApp: '01789637029',
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DMS_${currentBusiness?.name.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Business Profile & Settings</h1>
        <p className="text-xs text-slate-400">
          Customize your store branding, invoices, currency symbols, and export full database backups.
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>General Profile Information</span>
            </h2>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business / Organization Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business Type / Industry
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Retailer & Shopkeeper">Retailer & Shopkeeper</option>
                <option value="Wholesaler & Distributor">Wholesaler & Distributor</option>
                <option value="Manufacturer & Production">Manufacturer & Production</option>
                <option value="Grocery & Super Shop">Grocery & Super Shop</option>
                <option value="Electronics & Mobile">Electronics & Mobile</option>
                <option value="Pharmacy & Health">Pharmacy & Health</option>
                <option value="Fashion & Garments">Fashion & Garments</option>
                <option value="General Trading">General Trading</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business Logo (Storage Upload & URL)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... or upload below"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
              {logoUrl && (
                <div className="mt-2 flex items-center space-x-2">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-850 p-0.5"
                  />
                  <span className="text-[11px] text-emerald-400 truncate max-w-xs">
                    Logo attached successfully
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Contact & Invoicing Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Accounting & Numbering
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold"
                >
                  <option value="৳">৳ BDT (Bangladeshi Taka)</option>
                  <option value="$">$ USD (US Dollar)</option>
                  <option value="€">€ EUR (Euro)</option>
                  <option value="₹">₹ INR (Indian Rupee)</option>
                  <option value="£">£ GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Financial Accounting Year
                </label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Business Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Cloud Safety */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Data Safety, Export & Cloud Backups</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your business records are hosted in central Cloud Firestore. You can export a full JSON dump of your business data at any time for offline archival or migration.
        </p>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-sm font-bold text-white">Full Business Data Export (JSON)</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Exports: {products.length} Products, {customers.length} Customers, {sales.length} Invoices, {purchases.length} Purchases, {accounts.length} Accounts.
            </div>
          </div>
          <button
            onClick={handleExportFullBackup}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-2 shrink-0 shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup Archive</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <span className="font-semibold block mb-1">Configuring Automated Firebase Backups:</span>
          To set up automated scheduled backups for Cloud Firestore in production, navigate to your Google Cloud Console and configure Cloud Firestore managed export to a Cloud Storage bucket using Cloud Scheduler.
        </div>
      </div>

      {/* Official DMS Solution Support Card */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
              Customer Support
            </span>
            <h3 className="text-lg font-bold text-white">DMS Solution Support</h3>
            <p className="text-xs text-slate-300">
              Platform Owner: <strong className="text-white">DIL Mohammad Sohel</strong> • Official Customer Support WhatsApp:{' '}
              <strong className="text-emerald-400 font-mono">01789637029</strong>
            </p>
          </div>

          <a
            href="https://wa.me/01789637029"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/60 transition-all shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (01789637029)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
