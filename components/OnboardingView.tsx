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

const SETUP_SQL = `-- 1. TABLES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  updated_at timestamp with time zone default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  habit_name text,
  user_name text,
  log_created_date date,
  icon text,
  color text,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  habit_name text,
  user_name text,
  log_created_date date,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  duration_seconds integer not null,
  attributed_date date not null
);

-- 2. DENORMALIZATION SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.sync_user_name_to_denormalized_tables()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.full_name IS DISTINCT FROM NEW.full_name) THEN
    UPDATE public.habits SET user_name = NEW.full_name WHERE user_id = NEW.id;
    UPDATE public.habit_logs SET user_name = NEW.full_name WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_name_update') THEN
    CREATE TRIGGER on_profile_name_update
      AFTER UPDATE OF full_name ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.sync_user_name_to_denormalized_tables();
  END IF;
END $$;

-- 3. POLICIES
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

do $$ 
begin
  drop policy if exists "Users manage own habits" on public.habits;
  drop policy if exists "Users manage own logs" on public.habit_logs;
  drop policy if exists "Users view own profile" on public.profiles;
  drop policy if exists "Users update own profile" on public.profiles;
  
  create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);
  create policy "Users manage own logs" on public.habit_logs for all using (auth.uid() = user_id);
  create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
  create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
end $$;`;

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<HabitConfig[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomColor, setNewCustomColor] = useState(CUSTOM_COLORS[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const togglePreset = (name: string) => {
    setSelectedPresets(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const removeCustom = (name: string) => {
    setCustomHabits(prev => prev.filter(h => h.name !== name));
  };

  const addCustomHabit = () => {
    if (!newCustomName.trim()) return;
    if (PRESET_SUGGESTIONS.some(p => p.name.toLowerCase() === newCustomName.trim().toLowerCase()) || 
        customHabits.some(c => c.name.toLowerCase() === newCustomName.trim().toLowerCase())) {
      setError("This habit already exists.");
      return;
    }
    
    setCustomHabits(prev => [...prev, { 
      name: newCustomName.trim(), 
      color: newCustomColor, 
      icon: 'Target' 
    }]);
    setNewCustomName('');
    setIsAddingCustom(false);
    setError(null);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    const presetsToSubmit = PRESET_SUGGESTIONS.filter(p => selectedPresets.includes(p.name));
    const allHabits = [...presetsToSubmit, ...customHabits];

    if (allHabits.length === 0) {
      setError("Please select or add at least one habit to begin.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onComplete(allHabits);
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      setError("Database sync required. Run the SQL migration script below.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/20 rotate-12">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight italic">Select Your Habits</h1>
        </div>

        <div className="space-y-8">
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <p className="font-bold text-white">Action Required</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {error.includes("trigger") || error.includes("sync") 
                      ? "To keep your context in sync across historical logs, you must add the database trigger."
                      : error}
                  </p>
                </div>
              </div>
              
              {(error.includes("trigger") || error.includes("sync")) && (
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Database size={12} className="text-indigo-400" /> SYNC TRIGGER SQL
                    </div>
                    <button 
                      onClick={copySql}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-[10px] font-bold text-indigo-400 rounded-lg transition-all"
                    >
                      {copied ? <CheckCircle2 size={12} /> : <Database size={12} />} {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto max-h-32 scrollbar-thin">
                    {SETUP_SQL}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Presets */}
            {PRESET_SUGGESTIONS.map((preset) => {
              const isSelected = selectedPresets.includes(preset.name);
              return (
                <button
                  key={preset.name}
                  disabled={loading}
                  onClick={() => togglePreset(preset.name)}
                  className={`relative p-5 rounded-3xl border transition-all duration-300 text-left group h-32 ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20 translate-y-[-4px]' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } disabled:opacity-50`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${isSelected ? 'bg-white/20' : preset.color + ' bg-opacity-20'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : preset.color}`} />
                  </div>
                  <p className={`font-bold truncate pr-4 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{preset.name}</p>
                </button>
              );
            })}

            {/* Added Custom Habits */}
            {customHabits.map((habit) => (
              <div
                key={habit.name}
                className="relative p-5 rounded-3xl border bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20 translate-y-[-4px] text-left h-32"
              >
                <button 
                  onClick={() => removeCustom(habit.name)}
                  className="absolute top-3 right-3 p-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-white/20">
                  <Tag size={18} className="text-white" />
                </div>
                <p className="font-bold text-white truncate pr-6">{habit.name}</p>
                <span className="text-[8px] font-black uppercase tracking-tighter bg-white/20 px-1.5 py-0.5 rounded text-white mt-1 inline-block">Custom</span>
              </div>
            ))}

            {/* Add Custom Button/Input */}
            {!isAddingCustom ? (
              <button
                disabled={loading}
                onClick={() => setIsAddingCustom(true)}
                className="p-5 rounded-3xl border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/50 transition-all flex flex-col items-center justify-center gap-2 group h-32"
              >
                <Plus size={24} className="text-slate-500 group-hover:text-indigo-400 group-hover:scale-125 transition-all" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest">Custom</span>
              </button>
            ) : (
              <div className="p-5 rounded-[2.5rem] border-2 border-indigo-500 bg-slate-900 animate-in zoom-in-95 duration-200 h-auto sm:min-h-40 flex flex-col justify-between overflow-hidden shadow-2xl">
                <input 
                  autoFocus
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomHabit()}
                  placeholder="Habit name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                />
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-5 gap-2.5">
                    {CUSTOM_COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setNewCustomColor(c)}
                        className={`w-6 h-6 rounded-full shrink-0 ${c} ${newCustomColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button onClick={() => setIsAddingCustom(false)} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors" title="Cancel"><X size={20} /></button>
                    <button onClick={addCustomHabit} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20" title="Confirm Habit"><CheckCircle2 size={20} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <button 
              onClick={handleFinish}
              disabled={loading}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-lg rounded-[2.5rem] shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <>Syncing Database... <Loader2 className="animate-spin" size={20} /></>
              ) : (
                <>Start Tracking</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;