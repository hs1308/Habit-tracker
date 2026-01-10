import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Copy, CheckCircle2, Database, Plus, X, Tag } from 'lucide-react';

interface HabitConfig {
  name: string;
  color: string;
  icon: string;
}

interface OnboardingViewProps {
  onComplete: (habits: HabitConfig[]) => Promise<void>;
}

const PRESET_SUGGESTIONS: HabitConfig[] = [
  { name: 'Reading', color: 'bg-blue-500', icon: 'Reading' },
  { name: 'Exercising', color: 'bg-orange-500', icon: 'Exercising' },
  { name: 'Coding', color: 'bg-indigo-500', icon: 'Building' },
  { name: 'Studying', color: 'bg-amber-500', icon: 'Learning' },
  { name: 'Running', color: 'bg-red-500', icon: 'Exercising' },
  { name: 'Work', color: 'bg-slate-500', icon: 'Target' },
  { name: 'Meditating', color: 'bg-emerald-500', icon: 'Focusing' },
  { name: 'Learning', color: 'bg-purple-500', icon: 'Learning' },
  { name: 'Music', color: 'bg-pink-500', icon: 'Music' },
];

const CUSTOM_COLORS = [
  'bg-indigo-500', 
  'bg-emerald-500', 
  'bg-purple-500', 
  'bg-orange-500', 
  'bg-blue-500', 
  'bg-red-500', 
  'bg-pink-500', 
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500'
];

const SETUP_SQL = `-- setup sql --`;

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<HabitConfig[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomColor, setNewCustomColor] = useState(CUSTOM_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCustomHabit = () => {
    if (!newCustomName.trim()) return;
    setCustomHabits(prev => [...prev, { name: newCustomName.trim(), color: newCustomColor, icon: 'Target' }]);
    setNewCustomName('');
    setIsAddingCustom(false);
  };

  const handleFinish = async () => {
    const all = [...PRESET_SUGGESTIONS.filter(p => selectedPresets.includes(p.name)), ...customHabits];
    if (all.length === 0) return setError("Select at least one habit.");
    setLoading(true);
    try { await onComplete(all); } catch (err) { setError("Database sync required."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-12"><Sparkles className="text-white" size={32} /></div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight italic">Select Your Habits</h1>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRESET_SUGGESTIONS.map((preset) => {
              const isSelected = selectedPresets.includes(preset.name);
              return (
                <button key={preset.name} onClick={() => setSelectedPresets(prev => prev.includes(preset.name) ? prev.filter(n => n !== preset.name) : [...prev, preset.name])} className={`p-6 rounded-[2rem] border transition-all h-32 text-left ${isSelected ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}>
                  <div className={`w-10 h-10 rounded-2xl mb-3 flex items-center justify-center ${isSelected ? 'bg-white/20' : preset.color + ' bg-opacity-20'}`}><div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : preset.color}`} /></div>
                  <p className="font-bold truncate">{preset.name}</p>
                </button>
              );
            })}
            {customHabits.map((habit) => (
              <div key={habit.name} className="relative p-6 rounded-[2rem] border bg-indigo-600 border-indigo-400 h-32 text-left">
                <button onClick={() => setCustomHabits(p => p.filter(h => h.name !== habit.name))} className="absolute top-4 right-4"><X size={18} /></button>
                <div className="w-10 h-10 rounded-2xl mb-3 flex items-center justify-center bg-white/20"><Tag size={20} /></div>
                <p className="font-bold truncate">{habit.name}</p>
              </div>
            ))}
            {!isAddingCustom ? (
              <button onClick={() => setIsAddingCustom(true)} className="p-6 rounded-[2rem] border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center gap-2 h-32 group hover:border-indigo-500 transition-all">
                <Plus size={32} className="text-slate-500 group-hover:text-indigo-400" /><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom</span>
              </button>
            ) : (
              <div className="p-4 rounded-[2rem] border-2 border-indigo-500 bg-slate-900 animate-in zoom-in-95 duration-200 h-auto flex flex-col justify-between shadow-2xl relative">
                <input 
                  autoFocus 
                  type="text" 
                  value={newCustomName} 
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="Habit name..." 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                />
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CUSTOM_COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setNewCustomColor(c)} 
                        className={`w-6 h-6 rounded-full shrink-0 ${c} ${newCustomColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`} 
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setIsAddingCustom(false)} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors"><X size={18} /></button>
                    <button onClick={addCustomHabit} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all"><CheckCircle2 size={18} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleFinish} disabled={loading} className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2.5rem] shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4">
            {loading ? <Loader2 className="animate-spin" /> : "Start Tracking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;