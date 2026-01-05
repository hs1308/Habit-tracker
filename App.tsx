
import React, { useState, useEffect, useMemo } from 'react';
import { Menu, FilterX, Play, History, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, HabitLog, ActiveTimer } from './types';
import WeeklyChart from './components/WeeklyChart';
import HabitSplitGrid from './components/HabitSplitGrid';
import TimerOverlay from './components/TimerOverlay';
import RecordActivityModal from './components/RecordActivityModal';
import Sidebar from './components/Sidebar';
import LogsView from './components/LogsView';
import SettingsView from './components/SettingsView';
import OnboardingView from './components/OnboardingView';
import AuthView from './components/AuthView';
import { getAttributedDate, getPeriodDates } from './utils/dateUtils';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isTimerPickerOpen, setIsTimerPickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Auth State Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (session?.user && isSupabaseConfigured && supabase) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', session.user.id),
        supabase.from('habit_logs').select('*').eq('user_id', session.user.id)
      ]);

      if (habitsRes.data) setHabits(habitsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (e) {
      console.error("Failed to fetch user data", e);
    }
  };

  // Derived State
  const activePeriodDates = useMemo(() => getPeriodDates(referenceDate, viewMode), [referenceDate, viewMode]);
  const activeHabits = habits.filter(h => !h.deleted_at);
  const filteredLogs = useMemo(() => {
    if (!selectedHabitId) return logs;
    return logs.filter(log => log.habit_id === selectedHabitId);
  }, [logs, selectedHabitId]);

  const selectedHabitName = habits.find(h => h.id === selectedHabitId)?.name;

  // Handlers
  const handleOnboardingComplete = async (newHabitConfigs: { name: string; color: string; icon: string }[]) => {
    if (!session?.user || !supabase) return;
    
    // First, ensure the profile exists (Trigger might have a slight delay on some latency regions)
    const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
    
    const newHabitsToInsert = newHabitConfigs.map(config => ({
      name: config.name,
      icon: config.icon,
      color: config.color,
      user_id: session.user.id
    }));

    const { data, error } = await supabase.from('habits').insert(newHabitsToInsert).select();
    
    if (error) {
      console.error("Habit insertion error:", error);
      throw new Error(error.message);
    }

    if (data) {
      setHabits(prev => [...prev, ...data]);
    }
  };

  const handleStartTimer = (habitId: string) => {
    setActiveTimer({ habitId, startTime: Date.now() });
    setIsTimerPickerOpen(false);
  };

  const handleCompleteTimer = async (durationSeconds: number) => {
    if (!activeTimer || !session?.user || !supabase) return;
    const start = new Date(activeTimer.startTime);
    const end = new Date(activeTimer.startTime + durationSeconds * 1000);

    const newLogEntry = {
      habit_id: activeTimer.habitId,
      user_id: session.user.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_seconds: durationSeconds,
      attributed_date: getAttributedDate(start),
    };

    const { data, error } = await supabase.from('habit_logs').insert([newLogEntry]).select();
    if (data) setLogs(prev => [...prev, data[0]]);
    setActiveTimer(null);
  };

  const handleManualRecord = async (habitId: string, startStr: string, endStr: string, logId?: string) => {
    if (!session?.user || !supabase) return;
    const start = new Date(startStr);
    const duration = Math.floor((new Date(endStr).getTime() - start.getTime()) / 1000);

    if (logId) {
      const { data } = await supabase.from('habit_logs').update({
        habit_id: habitId,
        start_time: startStr,
        end_time: endStr,
        duration_seconds: duration,
        attributed_date: getAttributedDate(start)
      }).eq('id', logId).select();
      
      if (data) setLogs(prev => prev.map(l => l.id === logId ? data[0] : l));
    } else {
      const { data } = await supabase.from('habit_logs').insert([{
        habit_id: habitId,
        user_id: session.user.id,
        start_time: startStr,
        end_time: endStr,
        duration_seconds: duration,
        attributed_date: getAttributedDate(start),
      }]).select();
      if (data) setLogs(prev => [...prev, data[0]]);
    }
    setShowRecordModal(false);
  };

  const handleAddHabit = async (name: string, color: string) => {
    if (!session?.user || !supabase) return;
    const { data } = await supabase.from('habits').insert([{
      name,
      icon: 'Target',
      color,
      user_id: session.user.id
    }]).select();
    if (data) setHabits(prev => [...prev, data[0]]);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!supabase) return;
    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from('habits').update({ deleted_at: deletedAt }).eq('id', id);
    if (!error) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, deleted_at: deletedAt } : h));
      if (selectedHabitId === id) setSelectedHabitId(null);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('habit_logs').delete().eq('id', id);
    if (!error) setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-600/20"></div>
    </div>
  );

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 italic">Infrastructure Missing</h1>
          <p className="text-slate-400 mb-10 leading-relaxed text-sm">
            The bridge to Supabase is disconnected. Check your <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-400 font-mono">supabase.ts</code> configuration.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl"
          >
            <RefreshCw size={20} /> Reconnect Now
          </button>
        </div>
      </div>
    );
  }

  if (!session) return <AuthView />;

  if (habits.length === 0) return <OnboardingView onComplete={handleOnboardingComplete} />;

  const activeTimerHabit = habits.find(h => h.id === activeTimer?.habitId);

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 md:px-0 bg-[#0f172a] pb-20">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        onNavigate={setCurrentView}
        user={session.user}
        onLogout={handleLogout}
      />

      <header className="py-10 flex justify-between items-center sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl z-40 border-b border-white/5 mb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic">
            BeConsistent
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Momentum Engine</p>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-indigo-500/50 transition-all shadow-xl active:scale-90 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-indigo-600/20 transition-colors" />
          <Menu size={24} className="text-slate-400 group-hover:text-white relative z-10" />
        </button>
      </header>

      {currentView === 'dashboard' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <section className="grid grid-cols-2 gap-5">
            <button 
              onClick={() => setIsTimerPickerOpen(true)}
              className="flex flex-col items-center justify-center p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 group"
            >
              <Play size={32} className="mb-3 group-hover:scale-110 transition-transform" fill="currentColor" />
              <span className="font-black text-white text-lg italic">Start</span>
            </button>
            <button 
              onClick={() => setShowRecordModal(true)}
              className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 hover:border-slate-700 transition-all active:scale-95 group"
            >
              <History size={32} className="mb-3 text-slate-500 group-hover:text-white transition-colors" />
              <span className="font-black text-slate-200 text-lg italic">Log</span>
            </button>
          </section>

          <WeeklyChart 
            logs={filteredLogs} 
            activePeriodDates={activePeriodDates}
            referenceDate={referenceDate}
            viewMode={viewMode}
            onNavigate={(dir) => {
                const newDate = new Date(referenceDate);
                if (viewMode === 'week') newDate.setDate(newDate.getDate() + (dir * 7));
                else newDate.setMonth(newDate.getMonth() + dir);
                setReferenceDate(newDate);
            }}
            onViewChange={setViewMode}
            filteredHabitName={selectedHabitName}
          />
          
          <HabitSplitGrid 
            habits={habits} 
            logs={logs} 
            activePeriodDates={activePeriodDates}
            selectedHabitId={selectedHabitId}
            onSelectHabit={setSelectedHabitId}
          />
          
          {selectedHabitId && (
            <div className="flex justify-center">
              <button 
                onClick={() => setSelectedHabitId(null)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-full text-xs font-black text-slate-500 hover:text-white hover:border-indigo-500 transition-all shadow-lg italic"
              >
                <FilterX size={14} /> Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'logs' && (
        <LogsView 
          logs={logs} 
          habits={habits} 
          onDeleteLog={handleDeleteLog} 
          onUpdateLog={handleManualRecord}
          onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {currentView === 'settings' && (
        <SettingsView 
          habits={habits} 
          onAddHabit={handleAddHabit} 
          onDeleteHabit={handleDeleteHabit} 
          onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {isTimerPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">Select Focus</h2>
              <button onClick={() => setIsTimerPickerOpen(false)} className="text-slate-600 hover:text-white transition-colors p-2"><Plus size={28} className="rotate-45" /></button>
            </div>
            {activeHabits.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-6 font-medium">No active habits found.</p>
                <button 
                  onClick={() => { setIsTimerPickerOpen(false); setCurrentView('settings'); }}
                  className="bg-indigo-600 px-6 py-3 rounded-2xl font-black text-white italic"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {activeHabits.map(h => (
                  <button 
                    key={h.id} 
                    onClick={() => handleStartTimer(h.id)}
                    className="p-6 bg-slate-800/50 rounded-3xl text-left border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all active:scale-95 flex flex-col gap-3 group"
                  >
                    <div className={`w-3 h-3 rounded-full ${h.color} shadow-lg shadow-current/20 group-hover:scale-125 transition-transform`} />
                    <p className="font-black text-white truncate">{h.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTimer && activeTimerHabit && (
        <TimerOverlay 
          habit={activeTimerHabit} 
          activeTimer={activeTimer} 
          onCancel={() => setActiveTimer(null)}
          onComplete={handleCompleteTimer}
        />
      )}

      {showRecordModal && (
        <RecordActivityModal 
          habits={activeHabits} 
          onClose={() => setShowRecordModal(false)}
          onSave={handleManualRecord}
        />
      )}
    </div>
  );
};

export default App;
