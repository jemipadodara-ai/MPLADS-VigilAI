import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase';
import { formatAuthError } from '../../utils/authErrors';

export interface UserAuthProfile {
  uid?: string;
  email: string | null;
  displayName?: string | null;
  role?: 'admin' | 'standard';
  isAnonymous?: boolean;
}

interface LoginProps {
  onLoginSuccess: (user: UserAuthProfile) => void;
  onNavigateToSignUp?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle standard Email/Password authentication
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      onLoginSuccess({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || cleanEmail.split('@')[0],
        isAnonymous: false,
      });
    } catch (err: any) {
      console.warn('Sign-in error:', err);
      setErrorMessage(formatAuthError(err, false));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle simple Guest access without promotional clutter
  const handleGuestAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      try {
        const userCredential = await signInAnonymously(auth);
        onLoginSuccess({
          uid: userCredential.user.uid,
          email: 'auditor.guest@mospi.gov.in',
          displayName: 'Guest Auditor',
          isAnonymous: true,
          role: 'standard',
        });
        return;
      } catch (fbErr) {
        console.warn('Anonymous auth fallback:', fbErr);
      }

      // Guest session fallback if anonymous auth not enabled in console
      onLoginSuccess({
        email: 'auditor.guest@mospi.gov.in',
        displayName: 'Guest Auditor',
        isAnonymous: true,
        role: 'standard',
      });
    } catch (err: any) {
      setErrorMessage('Could not sign in as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Subtle Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Clean Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign In
          </h1>
        </div>

        {/* Clean Authentication Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Error Alert State */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Simple Secondary Guest Access Button */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-700/60 w-full" />
            <span className="bg-slate-800/90 px-2.5 text-[11px] text-slate-400 absolute">or</span>
          </div>

          <button
            id="login-guest-btn"
            type="button"
            onClick={handleGuestAccess}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-600/60 flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue as Guest
          </button>

          {/* Navigation to Sign Up */}
          {onNavigateToSignUp && (
            <div className="text-center pt-3 border-t border-slate-700/60">
              <span className="text-xs text-slate-400">Don't have an account? </span>
              <button
                id="toggle-to-signup-btn"
                type="button"
                onClick={onNavigateToSignUp}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer transition-colors"
              >
                Create an account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
