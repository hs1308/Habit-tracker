
import React, { useState } from 'react';
import { 
  Sparkles, Loader2, AlertCircle, Copy, CheckCircle2, Database, Plus, X, 
  Tag, ChevronLeft, Book, Dumbbell, Code, Brain, Target, Coffee, Music, 
  Camera, Heart, Star, Zap, Smile, Moon, Sun, Droplets, Utensils, Bike, Gamepad, Footprints, Flower2
} from 'lucide-react';

interface HabitConfig {
  name: string;
  color: string;
  icon: string;
}

interface OnboardingViewProps {
  onComplete: (habits: HabitConfig[]) => Promise<void>;
  onLogout?: () => void;
}

const ICON_OPTIONS = [
  { name: 'Reading', icon: Book },
  { name: 'Exercising', icon: Dumbbell },
  { name: 'Building', icon: Code },
  { name: 'Learning', icon: Brain },
  { name: 'Target', icon: Target },
  { name: 'Focusing', icon: Coffee },
  { name: 'Music', icon: Music },
  { name: 'Creative', icon: Camera },
  { name: 'Health', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Energy', icon: Zap },
  { name: 'Happiness', icon: Smile },
  { name: 'Sleep', icon: Moon },
  { name: 'Morning', icon: Sun },
  { name: 'Hydration', icon: Droplets },
  { name: 'Food', icon: Utensils },
  { name: 'Cycling', icon: Bike },
  { name: 'Gaming', icon: Gamepad },
  { name: 'Running', icon: Footprints },
  { name: 'Meditating', icon: Flower2 },
];

const PRESET_SUGGESTIONS: HabitConfig[] = [
  { name: 'Reading', color: 'bg-blue-500', icon: 'Reading' },
  { name: 'Exercising', color: 'bg-orange-500', icon: 'Exercising' },
  { name: 'Coding', color: 'bg-indigo-500', icon: 'Building' },
  { name: 'Studying', color: 'bg-amber-500', icon: 'Learning' },
  { name: 'Running', color: 'bg-red-500', icon: 'Running' },
  { name: 'Work', color: 'bg-slate-500', icon: 'Target' },
  { name: 'Meditating', color: 'bg-emerald-500', icon: 'Meditating' },
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
  'bg-rose-500',
  'bg-lime-500',
  'bg-fuchsia-500'
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onLogout }) => {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<HabitConfig[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomColor, setNewCustomColor] = useState(CUSTOM_COLORS[0]);
  const [newCustomIcon, setNewCustomIcon] = useState('Target');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCustomHabit = () => {
    if (!newCustomName.trim()) return;
    setCustomHabits(prev => [...prev, { name: newCustomName.trim(), color: newCustomColor, icon: newCustomIcon }]);
    setNewCustomName('');
    setNewCustomIcon('Target');
    setIsAddingCustom(false);
  };

  const handleFinish = async () => {
    const all = [...PRESET_SUGGESTIONS.filter(p => selectedPresets.includes(p.name)), ...customHabits];
    if (all.length === 0) return setError("Select at least one habit.");
    setLoading(true);
    try { await onComplete(all); } catch (err) { setError("Database sync required."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700 relative">
      {onLogout && (
        <button 
          onClick={onLogout}
          className="absolute top-8 left-8 p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Back</span>
        </button>
      )}

      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-12"><Sparkles className="text-white" size={32} /></div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight italic">Select Your Habits</h1>
          {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">{error}</p>}
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRESET_SUGGESTIONS.map((preset) => {
              const isSelected = selectedPresets.includes(preset.name);
              const IconComp = ICON_OPTIONS.find(i => i.name === preset.icon)?.icon || Target;
              return (
                <button key={preset.name} onClick={() => setSelectedPresets(prev => prev.includes(preset.name) ? prev.filter(n => n !== preset.name) : [...prev, preset.name])} className={`p-6 rounded-[2rem] border transition-all h-32 text-left ${isSelected ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}>
                  <div className={`w-10 h-10 rounded-2xl mb-3 flex items-center justify-center ${isSelected ? 'bg-white/20' : preset.color + ' bg-opacity-20'}`}>
                    <IconComp size={20} className={isSelected ? 'text-white' : 'text-white opacity-70'} />
                  </div>
                  <p className="font-bold truncate">{preset.name}</p>
                </button>
              );
            })}
            {customHabits.map((habit) => {
              const IconComp = ICON_OPTIONS.find(i => i.name === habit.icon)?.icon || Target;
              return (
                <div key={habit.name} className="relative p-6 rounded-[2rem] border bg-indigo-600 border-indigo-400 h-32 text-left">
                  <button onClick={() => setCustomHabits(p => p.filter(h => h.name !== habit.name))} className="absolute top-4 right-4"><X size={18} /></button>
                  <div className="w-10 h-10 rounded-2xl mb-3 flex items-center justify-center bg-white/20">
                    <IconComp size={20} />
                  </div>
                  <p className="font-bold truncate">{habit.name}</p>
                </div>
              );
            })}
            {!isAddingCustom ? (
              <button onClick={() => setIsAddingCustom(true)} className="p-6 rounded-[2rem] border border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/50 transition-all h-32 flex flex-col items-center justify-center gap-2 group">
                <Plus size={24} className="text-slate-500 group-hover:text-indigo-400" />
                <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest">Custom</span>
              </button>
            ) : (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black italic text-indigo-400 flex items-center gap-2">
                      <Sparkles size={24} /> Custom Habit
                    </h3>
                    <button onClick={() => setIsAddingCustom(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Habit Name</label>
                      <input 
                        autoFocus
                        type="text"
                        value={newCustomName}
                        onChange={(e) => setNewCustomName(e.target.value)}
                        placeholder="Habit Name..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Color</label>
                      <div className="flex flex-wrap gap-2">
                        {CUSTOM_COLORS.map(c => (
                          <button key={c} onClick={() => setNewCustomColor(c)} className={`w-6 h-6 rounded-full ${c} ${newCustomColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`} />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon</label>
                      <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                        {ICON_OPTIONS.map(opt => {
                          const IconComp = opt.icon;
                          const isSelected = newCustomIcon === opt.name;
                          return (
                            <button 
                              key={opt.name}
                              onClick={() => setNewCustomIcon(opt.name)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                            >
                              <IconComp size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setIsAddingCustom(false)} className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl">Cancel</button>
                      <button onClick={addCustomHabit} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20">Add Habit</button>
                    </div>
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
