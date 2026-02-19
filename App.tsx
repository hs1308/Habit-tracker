
import './style.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, Play, History, Plus, AlertCircle, StickyNote, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, HabitLog, ActiveTimer, Profile } from './types';
import WeeklyChart from './components/WeeklyChart';
import HabitSplitGrid from './components/HabitSplitGrid';
import TimerOverlay from './components/TimerOverlay';
import RecordActivityModal from './components/RecordActivityModal';
import Sidebar from './components/Sidebar';
import LogsView from './components/LogsView';
import SettingsView from './components/SettingsView';
import OnboardingView from './components/OnboardingView';
import AuthView from './components/AuthView';
import NotepadView from './components/NotepadView';
import { getAttributedDate, getPeriodDates } from './utils/dateUtils';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Auth loading
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Data loading
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isTimerPickerOpen, setIsTimerPickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'logs' | 'settings' | 'notepad'>('dashboard');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Notepad specific state
  const [notepadContent, setNotepadContent] = useState('');
  const [isNotepadSaving, setIsNotepadSaving] = useState(false);
  const [lastNotepadSaved, setLastNotepadSaved] = useState<Date | null>(null);
  const notepadSyncTimer = useRef<any>(null);
  const hasLoadedInitialNotepad = useRef(false);

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

  useEffect(() => {
    if (session?.user && isSupabaseConfigured && supabase) {
      fetchUserData();
      fetchProfile();
    }
  }, [session]);

  // CRITICAL: Only pull notepad content from profile ONCE on login/load.
  // This prevents local typing from being overwritten by database refreshes.
  useEffect(() => {
    if (profile?.notepad_content !== undefined && !hasLoadedInitialNotepad.current) {
      setNotepadContent(profile.notepad_content || '');
      hasLoadedInitialNotepad.current = true;
    }
  }, [profile?.notepad_content]);

  const fetchProfile = async () => {
    if (!session?.user || !supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) setProfile(data);
  };

  const fetchUserData = async () => {
    if (!session?.user || !supabase) return;
    try {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', session.user.id),
        supabase.from('habit_logs').select('*').eq('user_id', session.user.id)
      ]);
      if (habitsRes.data) setHabits(habitsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (e) { 
      console.error("Error fetching user data:", e); 
    } finally {
      setIsInitialLoad(false);
    }
  };

  const updateNickname = async (name: string) => {
    if (!session?.user || !supabase) return;
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', session.user.id);
    if (error) throw error;
    fetchProfile();
  };

  const syncNotepadToCloud = async (content: string) => {
    if (!session?.user || !supabase) return;
    setIsNotepadSaving(true);
    
    if (notepadSyncTimer.current) clearTimeout(notepadSyncTimer.current);
    
    notepadSyncTimer.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('profiles').update({ notepad_content: content }).eq('id', session.user.id);
        if (error) throw error;
        setLastNotepadSaved(new Date());
        // Silent update to local profile ref
        setProfile(prev => prev ? { ...prev, notepad_content: content } : null);
      } catch (err) {
        console.error("Notepad sync failed:", err);
      } finally {
        setIsNotepadSaving(false);
      }
    }, 1000);
  };

  const handleNotepadChange = (newContent: string) => {
    setNotepadContent(newContent);
    syncNotepadToCloud(newContent);
  };

  const activePeriodDates = useMemo(() => getPeriodDates(referenceDate, viewMode), [referenceDate, viewMode]);
  const activeHabits = habits.filter(h => !h.deleted_at);

  const currentUserNickname = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    if (session?.user?.email) return session.user.email.split('@')[0];
    return 'Guest User';
  }, [profile, session]);

  const handleOnboardingComplete = async (newHabitConfigs: { name: string; color: string; icon: string }[]) => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;
    const newHabitsToInsert = newHabitConfigs.map(config => ({
      name: config.name,
      habit_name: config.name,
      user_name: currentUserNickname,
      log_created_date: getAttributedDate(new Date()),
      icon: config.icon,
      color: config.color,
      user_id: userId
    }));
    const { error } = await supabase.from('habits').insert(newHabitsToInsert);
    if (error) throw new Error(error.message);
    fetchUserData();
  };

  const handleStartTimer = (habitId: string) => {
    setActiveTimer({ habitId, startTime: Date.now() });
    setIsTimerPickerOpen(false);
  };

  const handleCompleteTimer = async (durationSeconds: number) => {
    if (!activeTimer || !session?.user || !supabase) return;
    const userId = session.user.id;
    const habit = habits.find(h => h.id === activeTimer.habitId);
    const start = new Date(activeTimer.startTime);
    const end = new Date(activeTimer.startTime + durationSeconds * 1000);

    const newLogEntry = {
      habit_id: activeTimer.habitId,
      user_id: userId,
      habit_name: habit?.name || 'Unknown',
      user_name: currentUserNickname,
      log_created_date: getAttributedDate(new Date()),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_seconds: durationSeconds,
      attributed_date: getAttributedDate(start),
    };

    const { error } = await supabase.from('habit_logs').insert([newLogEntry]);
    if (error) console.error("Error logging activity:", error);
    await fetchUserData();
    setActiveTimer(null);
  };

  const handleManualRecord = async (habitId: string, startStr: string, endStr: string, logId?: string) => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;
    const habit = habits.find(h => h.id === habitId);
    const start = new Date(startStr);
    const duration = Math.floor((new Date(endStr).getTime() - start.getTime()) / 1000);

    const payload: any = {
      habit_id: habitId,
      start_time: startStr,
      end_time: endStr,
      duration_seconds: duration,
      attributed_date: getAttributedDate(start),
      habit_name: habit?.name || 'Unknown',
      user_name: currentUserNickname,
      log_created_date: getAttributedDate(new Date())
    };

    if (logId) {
      const { error } = await supabase.from('habit_logs').update(payload).eq('id', logId);
      if (error) console.error("Error updating log:", error);
    } else {
      payload.user_id = userId;
      const { error } = await supabase.from('habit_logs').insert([payload]);
      if (error) console.error("Error inserting log:", error);
    }
    await fetchUserData();
    setShowRecordModal(false);
  };

  const handleAddHabit = async (name: string, color: string) => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;
    const { error } = await supabase.from('habits').insert([{
      name, 
      habit_name: name, 
      user_name: currentUserNickname,
      log_created_date: getAttributedDate(new Date()), 
      icon: 'Target', 
      color, 
      user_id: userId
    }]);
    
    if (error) {
      console.error("Error adding habit:", error);
      alert("Could not add habit: " + error.message);
      return;
    }
    await fetchUserData();
  };

  const handleDeleteHabit = async (id: string) => {
    if (!supabase || !session?.user) return;
    
    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from('habits')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error("Error archiving habit:", error);
      throw error; 
    }
    
    if (selectedHabitId === id) setSelectedHabitId(null);
    await fetchUserData();
  };

  const handleDeleteLog = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('habit_logs').delete().eq('id', id);
    if (error) {
        console.error("Error deleting log:", error);
        alert("Failed to delete log.");
        return;
    }
    await fetchUserData();
  };

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isSupabaseConfigured || !supabase) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
        <AlertCircle className="text-red-500 mx-auto mb-8" size={40} />
        <h1 className="text-3xl font-black text-white mb-4">Infrastructure Missing</h1>
        <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl">Reconnect Now</button>
      </div>
    </div>
  );

  if (!session) return <AuthView />;

  if (isInitialLoad) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Restoring Context</p>
      </div>
    </div>
  );

  if (habits.length === 0) return <OnboardingView onComplete={handleOnboardingComplete} onLogout={handleLogout} />;

  const activeTimerHabit = habits.find(h => h.id === activeTimer?.habitId);

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 md:px-0 bg-[#0f172a] pb-20">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        onNavigate={setCurrentView}
        user={session.user}
        profile={profile}
        onLogout={handleLogout}
        onUpdateNickname={updateNickname}
      />
      <header className="py-5 flex justify-between items-center sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl z-40 border-b border-white/5">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="max-w-md flex flex-col items-start transition-all active:scale-[0.98] text-left md:hover:opacity-80 active:opacity-70"
        >
          <h1 className="text-3xl font-black text-white">Just Show Up</h1>
          <p className="text-[10px] text-slate-500 font-medium italic">Especially when you really don't want to</p>
        </button>
        <button onClick={() => setIsSidebarOpen(true)} className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Menu size={24} className="text-slate-400" />
        </button>
      </header>
      
      {currentView === 'dashboard' && (
        <div className="space-y-10">
          <section className="grid grid-cols-2 gap-5 pt-4">
            <button 
              onClick={() => setIsTimerPickerOpen(true)} 
              className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] transition-transform active:scale-[0.97]"
            >
              <Play fill="currentColor" size={32} className="mb-2 text-indigo-500" />
              <span className="font-black text-white">Start Working</span>
            </button>
            <button 
              onClick={() => setShowRecordModal(true)} 
              className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] transition-transform active:scale-[0.97]"
            >
              <History size={32} className="mb-2 text-slate-500" />
              <span className="font-black text-slate-200">Record Past</span>
            </button>
          </section>
          
          <WeeklyChart 
            logs={logs} 
            habits={habits}
            activePeriodDates={activePeriodDates} 
            referenceDate={referenceDate} 
            viewMode={viewMode} 
            selectedHabitId={selectedHabitId}
            onNavigate={(dir) => {
                const newDate = new Date(referenceDate);
                if (viewMode === 'week') newDate.setDate(newDate.getDate() + (dir * 7));
                else newDate.setMonth(newDate.getMonth() + dir);
                setReferenceDate(newDate);
            }} 
            onViewChange={setViewMode} 
            filteredHabitName={habits.find(h => h.id === selectedHabitId)?.name}
          />
          
          <HabitSplitGrid 
            habits={habits} 
            logs={logs} 
            activePeriodDates={activePeriodDates} 
            selectedHabitId={selectedHabitId} 
            onSelectHabit={setSelectedHabitId} 
          />

          <section className="pb-10 flex justify-center">
            <button 
              onClick={() => setCurrentView('notepad')}
              className="px-8 py-5 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center gap-5 group hover:border-indigo-500/50 transition-all active:scale-[0.98] active:bg-slate-800 shadow-lg shadow-black/20"
            >
              <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <StickyNote size={20} />
              </div>
              <span className="text-lg font-semibold text-slate-200">Scratchpad</span>
            </button>
          </section>
        </div>
      )}
      
      {currentView === 'logs' && (
        <LogsView 
          logs={logs} 
          habits={habits} 
          onDeleteLog={handleDeleteLog} 
          onUpdateLog={(logId, habitId, start, end) => handleManualRecord(habitId, start, end, logId)} 
          onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {currentView === 'notepad' && (
        <NotepadView 
          content={notepadContent}
          isSaving={isNotepadSaving}
          lastSaved={lastNotepadSaved}
          onChange={handleNotepadChange}
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
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic">Select Focus</h2>
              <button onClick={() => setIsTimerPickerOpen(false)}>
                <Plus size={28} className="rotate-45 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {activeHabits.map(h => (
                <button 
                  key={h.id} 
                  onClick={() => handleStartTimer(h.id)} 
                  className="p-6 bg-slate-800/50 rounded-3xl text-left border border-slate-700 hover:border-indigo-500 transition-all group"
                >
                  <div className={`w-3 h-3 rounded-full ${h.color} mb-3 shadow-lg group-hover:scale-125 transition-transform`} />
                  <p className="font-black text-white truncate">{h.name}</p>
                </button>
              ))}
            </div>
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