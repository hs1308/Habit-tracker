
import React, { useState } from 'react';
import { X, Check, Trash2, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Friendship } from '../types';

interface FriendRequestsModalProps {
  received: Friendship[];
  sent: Friendship[];
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onClose: () => void;
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  received,
  sent,
  onAccept,
  onDecline,
  onCancel,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold text-slate-200">Requests</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        <div className="flex p-1 bg-slate-800 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === 'received' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowDownLeft size={14} />
            Received
            {received.length > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">
                {received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sent' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ArrowUpRight size={14} />
            Sent
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {activeTab === 'received' ? (
            received.length > 0 ? (
              received.map((req) => (
                <div key={req.id} className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{req.sender?.full_name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{req.sender?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(req.id)}
                      className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => onDecline(req.id)}
                      className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 italic">No pending requests</div>
            )
          ) : (
            sent.length > 0 ? (
              sent.map((req) => (
                <div key={req.id} className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700/20 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700/30">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{req.receiver?.full_name || 'Pending...'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{req.receiver?.email || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onCancel(req.id)}
                    className="w-10 h-10 bg-slate-700/20 text-slate-500 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 italic">No sent requests</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;
