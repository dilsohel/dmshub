import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthViewProps {
  onOpenSupport: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onOpenSupport }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOperationNotAllowedGuide, setShowOperationNotAllowedGuide] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowOperationNotAllowedGuide(false);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setShowOperationNotAllowedGuide(true);
        setErrorMessage(
          'Email/Password sign-in is currently disabled in your Firebase project. Please click "Sign in with Google" below, or enable Email/Password in your Firebase Console.'
        );
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setShowOperationNotAllowedGuide(false);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Browser blocked the Google sign-in popup. Please allow popups for this window and click again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in window was closed before completing. Please click the button to try again.');
      } else {
        setErrorMessage(err.message || 'Google Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-4 py-2 text-xs flex justify-between items-center text-emerald-100 border-b border-emerald-700/50">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-[10px]">
            Official Support
          </span>
          <span>DMS Solution Support • Owner: <strong>DIL Mohammad Sohel</strong></span>
        </div>
        <a
          href="https://wa.me/01789637029"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[11px] inline-flex items-center space-x-1.5 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp: 01789637029</span>
        </a>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand & Value Prop */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-emerald-500/20">
                DMS
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  DMS Solution
                </h1>
                <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
                  Complete Business Management SaaS
                </p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Manage your shop, wholesale & manufacturing business online.
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed">
              DMS Solution gives shopkeepers, wholesalers, and retailers complete control over invoices, inventory, customer dues, supplier payments, profit & loss, and accounting.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Multi-tenant business isolation with custom currency (default ৳ BDT)',
                'Instant POS billing, invoice printing & stock auto-deduction',
                'Customer & supplier ledgers with WhatsApp payment reminders',
                'Real-time cash, bank, and MFS (bKash/Nagad) accounting',
                'Comprehensive P&L, balance sheets, and audit trail logs',
              ].map((feat, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Need help onboarding?</div>
                <div className="text-sm font-semibold text-emerald-400">Talk directly to founder Sohel</div>
              </div>
              <button
                onClick={onOpenSupport}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact</span>
              </button>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isLogin
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isLogin
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Business Account
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <span>{errorMessage}</span>
                    {showOperationNotAllowedGuide && (
                      <div className="mt-3 pt-3 border-t border-rose-500/30 space-y-2.5">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-2 shadow-sm"
                        >
                          <span>Sign in with Google (Recommended - Works Now)</span>
                        </button>
                        <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <p className="font-semibold text-amber-300">To enable Email & Password registration:</p>
                          <ol className="list-decimal pl-4 space-y-0.5 text-slate-400">
                            <li>Open Firebase Console &gt; Authentication &gt; Sign-in method.</li>
                            <li>Click on <strong>Email/Password</strong>.</li>
                            <li>Toggle <strong>Enable</strong> and click <strong>Save</strong>.</li>
                          </ol>
                          <a
                            href="https://console.firebase.google.com/project/gen-lang-client-0838655207/authentication/providers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-400 hover:underline pt-1 font-semibold"
                          >
                            <span>Open Firebase Auth Console Settings &rarr;</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended 1-Click Google Sign-in Banner */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2.5 shadow-md active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google (1-Click Instant)</span>
                </button>
              </div>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <span className="relative bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold">
                  Or use Email & Password
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name / Business Owner Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. DIL Mohammad Sohel"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="business@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In to DMS Solution' : 'Create Free Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Reset Password</h3>
            <p className="text-xs text-slate-400">
              Enter your registered email and we'll send you a password reset link.
            </p>
            {resetSent ? (
              <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs rounded-xl border border-emerald-500/30">
                Password reset link sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSent(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
            {resetSent && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetSent(false);
                }}
                className="w-full py-2 bg-slate-800 text-white text-xs rounded-xl font-bold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="flex flex-wrap justify-center items-center gap-4 text-slate-400">
          <span>Website: <strong>DMS Solution</strong></span>
          <span>•</span>
          <span>Owner: <strong>DIL Mohammad Sohel</strong></span>
          <span>•</span>
          <span>Customer Support WhatsApp: <strong className="text-emerald-400">01789637029</strong></span>
          <span>•</span>
          <button onClick={onOpenSupport} className="text-emerald-400 hover:underline">
            Help & Contact
          </button>
        </div>
      </footer>
    </div>
  );
};
