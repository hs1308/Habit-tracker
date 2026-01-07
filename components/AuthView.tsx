import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Sparkles, UserCircle, ShieldAlert, ChevronDown, ChevronUp, Globe, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

const AuthView: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = window.location.origin;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error_description') || params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      setShowTroubleshoot(true);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoogleLogin = async (mode: 'standard' | 'safe' = 'standard') => {
    if (!supabase) return;
    setError(null);
    setLoading(true);
    
    try {
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
      setShowTroubleshoot(true);
    }
  };

  const handleGuestLogin = async () => {
    if (!supabase) return;
    setError(null);
    setGuestLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40 rotate-12 transition-transform hover:rotate-0 duration-500">
          <Sparkles className="text-white" size={40} />
        </div>
        
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tighter italic">BeConsistent</h1>
        
        {error ? (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 animate-in slide-in-from-top-2">
            <ShieldAlert size={18} className="text-red-500" />
            <p className="text-sm font-bold text-red-400 italic uppercase tracking-tighter">Handshake Error: 403 Forbidden</p>
          </div>
        ) : (
          <p className="text-slate-400 text-lg mb-12 max-w-xs mx-auto italic font-medium">
            &quot;We are what we repeatedly do.&quot;
          </p>
        )}

        <div className="space-y-4">
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
            onClick={handleGuestLogin}
            disabled={loading || guestLoading}
            className="w-full py-5 bg-slate-900 text-slate-400 font-bold text-lg rounded-[2.5rem] border border-slate-800 hover:bg-slate-800 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            {guestLoading ? (
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <><UserCircle size={24} className="text-slate-600 group-hover:text-indigo-400 transition-colors" /> Guest Access</>
            )}
          </button>
        </div>

        <div className="mt-12">
          <button 
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors italic"
          >
            {showTroubleshoot ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Setup Dynamic Preview URL
          </button>
          
          {showTroubleshoot && (
            <div className="mt-6 space-y-4 animate-in zoom-in-95 duration-300 text-left">
              <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-6">
                  <Globe size={16} className="text-indigo-400" />
                  <h3 className="font-black text-white italic uppercase text-xs tracking-widest">Preview Whitelist</h3>
                </div>
                
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-medium">
                  Because this app is in a <span className="text-indigo-400">Preview Mode</span>, you must add this exact URL to your Supabase Auth settings.
                </p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Your Current Preview URL</span>
                    <button onClick={copyToClipboard} className="text-indigo-400 hover:text-white">
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-400 break-all">{currentUrl}</code>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 text-[10px] font-bold">1</div>
                    <p className="text-[10px] text-slate-500">Go to <strong>Auth &gt; URL Configuration</strong> in Supabase.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 text-[10px] font-bold">2</div>
                    <p className="text-[10px] text-slate-500">Paste the URL above into both <strong>Site URL</strong> and <strong>Redirect URLs</strong>.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 text-[10px] font-bold">3</div>
                    <p className="text-[10px] text-slate-500">Wait 10 seconds for the settings to propagate, then try again.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  <strong>Important:</strong> If your environment generates a new URL (e.g. after a refresh or branch change), you must update the whitelist again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;