
import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddFriendModalProps {
  onClose: () => void;
  onSendRequest: (email: string) => Promise<void>;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onSendRequest }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      await onSendRequest(email.trim().toLowerCase());
      setStatus('success');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send request');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold text-slate-200">Add Friend</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <p className="text-lg font-bold text-white">Request Sent!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Friend's Email</label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@friend.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle size={18} />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {status === 'loading' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddFriendModal;
