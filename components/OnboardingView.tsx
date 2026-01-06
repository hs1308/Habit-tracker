
import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Copy, CheckCircle2, Database } from 'lucide-react';

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
-- This function propagates profile name changes to habits and logs automatically
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

-- Bind trigger to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_name_update') THEN
    CREATE TRIGGER on_profile_name_update
      AFTER UPDATE OF full_name ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.sync_user_name_to_denormalized_tables();
  END IF;
END $$;

-- 3. POLICIES (Idempotent)
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
    if (selectedPresets.length === 0) {
      setError("Please select at least one habit to begin.");
      return;
    }
    setError(null);
    setLoading(true);
    const finalHabits = PRESET_SUGGESTIONS.filter(p => selectedPresets.includes(p.name));
    try {
      await onComplete(finalHabits);
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      setError("Database sync required. Run the SQL migration script below.");
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
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight italic">Setup Habits</h1>
          <p className="text-slate-400 text-lg font-medium">Choose your starting focus areas.</p>
        </div>

        <div className="space-y-8">
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-bold text-white">Action Required</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    To keep your nickname in sync across historical logs, you must add the database trigger.
                  </p>
                </div>
              </div>
              
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
            </div>
          )}

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
                </button>
              );
            })}
          </div>

          <button 
            onClick={handleFinish}
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? (
              <>Syncing Database... <Loader2 className="animate-spin" size={20} /></>
            ) : (
              <>Start Consistency Track</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
