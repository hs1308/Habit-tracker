
import React, { useState } from 'react';
import { Check, Target, Sparkles, LayoutGrid, Loader2, AlertCircle, Copy, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: (habits: { name: string; color: string; icon: string }[]) => Promise<void>;
}

const PRESET_SUGGESTIONS = [
  { name: 'Reading', color: 'bg-blue-500', icon: 'Reading' },
  { name: 'Exercising', color: 'bg-orange-500', icon: 'Exercising' },
  { name: 'Coding', color: 'bg-indigo-500', icon: 'Building' },
  { name: 'Meditating', color: 'bg-emerald-500', icon: 'Focusing' },
  { name: 'Learning', color: 'bg-purple-500', icon: 'Learning' },
  { name: 'Music', color: 'bg-pink-500', icon: 'Music' },
];

const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 
  'bg-orange-500', 'bg-blue-500', 'bg-red-500', 
  'bg-pink-500', 'bg-amber-500'
];

const SETUP_SQL = `-- 1. CREATE PROFILES TABLE (Mirrors auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  updated_at timestamp with time zone default now()
);

-- 2. CREATE HABITS TABLE
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text,
  color text,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- 3. CREATE HABIT_LOGS TABLE
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  duration_seconds integer not null,
  attributed_date date not null
);

-- 4. ENABLE RLS (Security)
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- 5. CREATE SECURITY POLICIES
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);
create policy "Users manage own logs" on public.habit_logs for all using (auth.uid() = user_id);

-- 6. AUTOMATIC PROFILE CREATION TRIGGER
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. PERFORMANCE INDEXES
create index idx_habits_user_id on public.habits(user_id);
create index idx_habit_logs_user_id on public.habit_logs(user_id);
create index idx_habit_logs_habit_id on public.habit_logs(habit_id);`;

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const togglePreset = (name: string) => {
    setSelectedPresets(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);
    
    const finalHabits = PRESET_SUGGESTIONS
      .filter(p => selectedPresets.includes(p.name))
      .map(p => ({ ...p }));

    if (customName.trim()) {
      finalHabits.push({
        name: customName.trim(),
        color: customColor,
        icon: 'Target'
      });
    }

    try {
      if (finalHabits.length > 0) {
        await onComplete(finalHabits);
      } else {
        setError("Select at least one habit.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      const msg = err.message || "";
      if (msg.includes("relation") || msg.includes("does not exist")) {
        setError("Database tables not found. Run the SQL script to initialize the global schema.");
      } else {
        setError(err.message || "Failed to save habits.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-in fade-in duration-700">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/20 rotate-12">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">BeConsistent</h1>
          <p className="text-slate-400 text-lg">Foundation for your new habits.</p>
        </div>

        <div className="space-y-8">
          {error && (
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Database className="text-amber-500" size={24} />
                </div>
                <div>
                  <p className="font-bold text-white">Global Schema Required</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    To support 100s of users worldwide with secure isolation, you must initialize the backend tables.
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <ShieldCheck size={12} className="text-indigo-400" /> Production-Ready SQL
                  </div>
                  <button 
                    onClick={copySql}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-[10px] font-bold text-indigo-400 rounded-lg transition-all"
                  >
                    {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy Script</>}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto max-h-40 whitespace-pre scrollbar-thin">
                  {SETUP_SQL}
                </pre>
              </div>
              
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-[11px] text-slate-400 font-medium italic">
                  Run this in Supabase SQL Editor to enable worldwide access.
                </p>
              </div>
            </div>
          )}

          {/* Preset Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRESET_SUGGESTIONS.map((preset) => {
              const isSelected = selectedPresets.includes(preset.name);
              return (
                <button
                  key={preset.name}
                  disabled={loading}
                  onClick={() => togglePreset(preset.name)}
                  className={`relative p-5 rounded-3xl border transition-all duration-300 text-left group ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-600/20 translate-y-[-4px]' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } disabled:opacity-50`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${isSelected ? 'bg-white/20' : preset.color + ' bg-opacity-20'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : preset.color}`} />
                  </div>
                  <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{preset.name}</p>
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-white">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button 
            onClick={handleFinish}
            disabled={loading || (selectedPresets.length === 0 && !customName.trim())}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-lg rounded-[2rem] shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <>Syncing Database... <Loader2 className="animate-spin" size={20} /></>
            ) : (
              <>Launch Dashboard <LayoutGrid size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
