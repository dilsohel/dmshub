import React, { useState } from 'react';
import {
  Building2,
  Store,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
  HelpCircle,
  MessageCircle,
  Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { uploadFileToStorage } from '../lib/firebase';

interface BusinessSetupWizardProps {
  onCancel?: () => void;
  isFirstBusiness?: boolean;
  onOpenSupport: () => void;
}

export const BusinessSetupWizard: React.FC<BusinessSetupWizardProps> = ({
  onCancel,
  isFirstBusiness = true,
  onOpenSupport,
}) => {
  const { createNewBusiness, userProfile, user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(userProfile?.displayName || user?.displayName || '');
  const [businessType, setBusinessType] = useState('Retailer & Shopkeeper');
  const [address, setAddress] = useState('Dhaka, Bangladesh');
  const [phone, setPhone] = useState('01789637029');
  const [whatsapp, setWhatsapp] = useState('01789637029');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('৳');
  const [currencyCode, setCurrencyCode] = useState('BDT');
  const [invoicePrefix, setInvoicePrefix] = useState('DMS-');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `logos/new_biz_${Date.now()}.${ext}`;
      const url = await uploadFileToStorage(file, path);
      setLogoUrl(url);
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      setError('Failed to upload logo: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) {
      setError('Please provide your business name');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);
    try {
      const newBusinessPayload: any = {
        name: businessName.trim(),
        ownerName: ownerName.trim() || 'Owner',
        businessType,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        currency,
        currencyCode,
        invoicePrefix: invoicePrefix.trim().toUpperCase() || 'DMS-',
        nextInvoiceNumber: 1001,
        financialYear,
      };

      if (logoUrl.trim()) {
        newBusinessPayload.logoUrl = logoUrl.trim();
      }

      await createNewBusiness(newBusinessPayload);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Error creating business:', err);
      setError(err.message || 'Failed to initialize business. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Banner */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-900">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-sm">
            DMS
          </div>
          <span className="font-extrabold text-white text-base">DMS Solution</span>
        </div>
        <button
          onClick={onOpenSupport}
          className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center space-x-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Support: 01789637029</span>
        </button>
      </div>

      {/* Wizard Card */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className={step >= 1 ? 'text-emerald-400' : ''}>1. Business Profile</span>
              <span className={step >= 2 ? 'text-emerald-400' : ''}>2. Contact Details</span>
              <span className={step >= 3 ? 'text-emerald-400' : ''}>3. Financial Preferences</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Step 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Let's set up your business</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your business name and details to customize your invoices and accounts.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sohel Enterprise & Department Store"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. DIL Mohammad Sohel"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Business Type
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Logo Image (Upload or URL - Optional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... or upload from device"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{uploadingLogo ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                  {logoUrl && (
                    <div className="mt-2 flex items-center space-x-2">
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 p-0.5"
                      />
                      <span className="text-[11px] text-emerald-400">
                        Logo ready for business dashboard
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                {!isFirstBusiness && onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                ) : <div />}
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Contact & Address</h2>
                <p className="text-xs text-slate-400 mt-1">
                  This info appears on invoices, receipts, and order confirmations.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop #12, Market Square, Dhaka"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01789637029"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. 01789637029"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Business Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@business.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Finance & Defaults */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Finance & Invoicing Setup</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure default currency, numbering prefix, and fiscal accounting year.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Currency Symbol
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        setCurrencyCode(e.target.value === '৳' ? 'BDT' : e.target.value === '$' ? 'USD' : 'EUR');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="৳">৳ BDT (Bangladeshi Taka - Default)</option>
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
                      placeholder="DMS-"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Financial Year
                    </label>
                    <input
                      type="text"
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                      placeholder="2026-2027"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Starting Invoice Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value="1001 (Auto-increment)"
                      className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <div className="font-semibold flex items-center space-x-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Automatic Account Provisioning</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/90">
                    We will automatically configure <strong>Cash in Hand</strong>, <strong>Bank Account</strong>, and <strong>bKash MFS</strong> accounts so you can start selling immediately!
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Launch Business Dashboard</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-xs text-slate-500 pt-6 border-t border-slate-900">
        DMS Solution SaaS • Owner: DIL Mohammad Sohel • WhatsApp Support: 01789637029
      </div>
    </div>
  );
};
