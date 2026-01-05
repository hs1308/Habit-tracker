
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Sparkles, ShieldAlert, CheckCircle2, UserCircle, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';

const AuthView: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError("Supabase client not initialized.");
      return;
    }
    setError(null);
    setLoading(true);
    
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (authError) throw authError;
      
      // If no redirect happens within 5s
      setTimeout(() => {
        setLoading(false);
      }, 5000);

    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to initiate login.");
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!supabase) return;
    setError(null);
    setGuestLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        if (authError.message.includes("provider is not enabled")) {
          throw new Error("Anonymous Auth is disabled. Go to Supabase Dashboard -> Auth -> Providers -> Anonymous to enable.");
        }
        throw authError;
      }
    } catch (err: any) {
      console.error("Guest login failed:", err);
      setError(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40 rotate-12">
          <Sparkles className="text-white" size={40} />
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tighter italic">BeConsistent</h1>
        <p className="text-slate-400 text-lg mb-12 max-w-xs mx-auto">
          The high-performance habit tracker for those who value momentum.
        </p>

        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-left animate-in shake duration-300">
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <ShieldAlert size={24} />
              <h3 className="font-bold">403 Forbidden / Access Denied</h3>
            </div>
            <p className="text-red-200 text-sm mb-4 leading-relaxed font-mono bg-red-950/30 p-2 rounded">
              {error}
            </p>
            <div className="space-y-3">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Fix for Google Cloud Console:</p>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <ArrowRight size={14} className="mt-0.5 text-indigo-500 shrink-0" />
                <span>Go to <strong>OAuth Consent Screen</strong>. If status is "Testing", add your email to <strong>Test Users</strong>.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <ArrowRight size={14} className="mt-0.5 text-indigo-500 shrink-0" />
                <span>Or click <strong>"Publish App"</strong> to make it live for everyone.</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading || guestLoading}
            className="w-full py-5 bg-white text-slate-900 font-bold text-lg rounded-3xl shadow-xl hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Continue with Google
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <span className="relative bg-[#0f172a] px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">or</span>
          </div>

          <button 
            onClick={handleGuestLogin}
            disabled={loading || guestLoading}
            className="w-full py-5 bg-slate-900 text-slate-300 font-bold text-lg rounded-3xl border border-slate-800 hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            {guestLoading ? (
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserCircle size={24} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                Continue as Guest
              </>
            )}
          </button>
        </div>
        
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption</span>
            </div>
          </div>
          <a 
            href="https://console.cloud.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-indigo-500/50 hover:text-indigo-400 flex items-center gap-1 transition-colors uppercase tracking-widest"
          >
            Open Google Console <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
