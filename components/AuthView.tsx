
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TrendingUp, UserCircle, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

const AuthView: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  
  // Guest Access flow state
  const [showGuestNamePrompt, setShowGuestNamePrompt] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error_description') || params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }
  }, []);

  const handleGoogleLogin = async (mode: 'standard' | 'safe' = 'standard') => {
    if (!supabase) return;
    setError(null);
    setLoading(true);
    
    try {
      const currentUrl = window.location.origin;
      const options: any = {
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      };

      if (mode === 'standard') {
        options.options.redirectTo = currentUrl;
      }

      const { error: authError } = await supabase.auth.signInWithOAuth(options);
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || "403: URL Not Whitelisted");
      setLoading(false);
    }
  };

  const handleGuestLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supabase || !guestName.trim()) return;
    
    setError(null);
    setGuestLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;
      
      // Immediately set the guest name in the profile table
      if (data.user) {
        await supabase.from('profiles').update({ full_name: guestName.trim() }).eq('id', data.user.id);
      }
    } catch (err: any) {
      setError(err.message);
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-xl w-full text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40 rotate-12 transition-transform hover:rotate-0 duration-500">
          <TrendingUp className="text-white" size={40} />
        </div>
        
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tighter">Just Show Up</h1>
        
        {error ? (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 animate-in slide-in-from-top-2 max-w-md mx-auto">
            <ShieldAlert size={18} className="text-red-500" />
            <p className="text-sm font-bold text-red-400 italic uppercase tracking-tighter">Auth Error: Please try again</p>
          </div>
        ) : (
          <p className="text-slate-400 text-lg mb-12 max-w-prose mx-auto italic font-medium whitespace-nowrap overflow-hidden text-ellipsis px-4">
            "Especially when you really don't want to"
          </p>
        )}

        <div className="space-y-4 max-w-md mx-auto">
          {!showGuestNamePrompt ? (
            <>
              <button 
                onClick={() => handleGoogleLogin('standard')}
                disabled={loading || guestLoading}
                className="w-full py-5 bg-white text-slate-900 font-black text-lg rounded-[2.5rem] shadow-xl hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50 relative overflow-hidden"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                    Sign in with Google
                  </>
                )}
              </button>

              <button 
                onClick={() => setShowGuestNamePrompt(true)}
                disabled={loading || guestLoading}
                className="w-full py-5 bg-slate-900 text-slate-400 font-bold text-lg rounded-[2.5rem] border border-slate-800 hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
              >
                <UserCircle size={24} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Guest Access
              </button>
            </>
          ) : (
            <div className="animate-in zoom-in-95 duration-200">
              <form onSubmit={handleGuestLoginSubmit} className="space-y-4 bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
                <div className="text-left mb-6">
                  <h2 className="text-white font-black text-xl italic mb-1">Who are you?</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Enter a nickname to start tracking</p>
                </div>
                
                <div className="relative">
                  <input 
                    autoFocus
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Early Bird"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                   <button 
                    type="button"
                    onClick={() => setShowGuestNamePrompt(false)}
                    className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    disabled={!guestName.trim() || guestLoading}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all disabled:opacity-50"
                   >
                     {guestLoading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> Let's Go</>}
                   </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
