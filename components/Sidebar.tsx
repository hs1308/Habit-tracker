
import React, { useState, useEffect } from 'react';
import { X, LayoutDashboard, History, Settings, LogOut, Edit3, Check, Loader2 } from 'lucide-react';
import { Profile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'dashboard' | 'logs' | 'settings';
  onNavigate: (view: 'dashboard' | 'logs' | 'settings') => void;
  user: any;
  profile: Profile | null;
  onLogout: () => void;
  onUpdateNickname: (name: string) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onNavigate, 
  user, 
  profile,
  onLogout,
  onUpdateNickname
}) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.full_name || '');
    }
  }, [profile]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Activity Logs', icon: History },
    { id: 'settings', label: 'Habit Settings', icon: Settings },
  ] as const;

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    try {
      await onUpdateNickname(nickname.trim());
      setIsEditingNickname(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const userInitial = (nickname?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside 
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-[70] transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                BC
              </div>
              <div>
                <h2 className="font-bold text-lg">BeConsistent</h2>
                <p className="text-xs text-slate-500">v1.1.0</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-800 space-y-4">
             <div className="px-4 py-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditingNickname ? (
                      <div className="flex gap-1">
                        <input 
                          autoFocus
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Your nickname"
                        />
                        <button 
                          onClick={handleSaveNickname}
                          disabled={saving}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate text-white">{nickname || 'Set Nickname'}</p>
                        <button 
                          onClick={() => setIsEditingNickname(true)}
                          className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold"
                >
                  <LogOut size={14} /> Logout Session
                </button>
             </div>
             <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest font-bold">
               Consistency is key
             </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
