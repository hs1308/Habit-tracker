
import './style.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, Play, History, Plus, AlertCircle, StickyNote, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, HabitLog, ActiveTimer, Profile, Friendship } from './types';
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
import FriendsSection from './components/FriendsSection';
import AddFriendModal from './components/AddFriendModal';
import FriendRequestsModal from './components/FriendRequestsModal';
import FriendDashboardView from './components/FriendDashboardView';
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
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'logs' | 'settings' | 'notepad' | 'friend_view'>('dashboard');
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'more'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [trendRange, setTrendRange] = useState<30 | 60 | 90 | 'lifetime'>(30);
  const [trendGrouping, setTrendGrouping] = useState<'week' | 'month'>('week');

  // Social state
  const [friends, setFriends] = useState<Profile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

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
      if (!supabase) return;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setHabits([]);
        setLogs([]);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user && isSupabaseConfigured && supabase) {
      fetchUserData();
      fetchProfile();
      fetchSocialData();

      // Real-time subscription for friendships
      const friendshipSubscription = supabase
        .channel('friendship_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
          fetchSocialData();
        })
        .subscribe();

      return () => {
        friendshipSubscription.unsubscribe();
      };
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
    if (data) {
      setProfile(data);
      // Ensure email is in profiles table for social features
      if (!data.email && session.user.email) {
        await supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id);
      }
    }
  };

  const fetchSocialData = async () => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;

    try {
      // Fetch friendships where user is sender or receiver
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          *,
          sender:profiles!friendships_sender_id_fkey(*),
          receiver:profiles!friendships_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      const accepted = friendships.filter(f => f.status === 'accepted');
      const received = friendships.filter(f => f.status === 'pending' && f.receiver_id === userId);
      const sent = friendships.filter(f => f.status === 'pending' && f.sender_id === userId);

      // Extract friend profiles
      const friendProfiles = accepted.map(f => f.sender_id === userId ? f.receiver : f.sender) as Profile[];
      
      setFriends(friendProfiles);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  };

  const sendFriendRequest = async (email: string) => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;

    // 1. Find user by email
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (findError || !targetUser) throw new Error("User not found with this email");
    if (targetUser.id === userId) throw new Error("You cannot add yourself");

    // 2. Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${userId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') throw new Error("You are already friends");
      throw new Error("A request is already pending");
    }

    // 3. Insert new request
    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ sender_id: userId, receiver_id: targetUser.id, status: 'pending' });

    if (insertError) throw insertError;
    fetchSocialData();
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    if (error) console.error("Error accepting request:", error);
    fetchSocialData();
  };

  const declineFriendRequest = async (requestId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('friendships').delete().eq('id', requestId);
    if (error) console.error("Error declining request:", error);
    fetchSocialData();
  };

  const removeFriend = async (friendId: string) => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`);

      if (error) throw error;
      
      setFriends(prev => prev.filter(f => f.id !== friendId));
      setCurrentView('dashboard');
      setSelectedFriend(null);
    } catch (err) {
      console.error("Error removing friend:", err);
      alert("Failed to remove friend");
    }
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
      if (!supabase) return;
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

  const activePeriodDates = useMemo(() => {
    if (viewMode === 'more') {
      if (logs.length === 0) return [];
      
      const firstLogDate = (() => {
        const allDates = logs.map(l => new Date(l.attributed_date).getTime());
        const d = new Date(Math.min(...allDates));
        d.setHours(0,0,0,0);
        return d;
      })();

      let startDate: Date;
      const now = new Date();
      now.setHours(0,0,0,0);

      if (trendRange === 'lifetime') {
        startDate = new Date(firstLogDate);
      } else {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - trendRange);
        if (firstLogDate > startDate) {
          startDate = new Date(firstLogDate);
        }
      }
      startDate.setHours(0,0,0,0);

      const dates: string[] = [];
      const curr = new Date(startDate);
      while (curr <= now) {
        dates.push(getAttributedDate(curr));
        curr.setDate(curr.getDate() + 1);
      }
      return dates;
    }
    return getPeriodDates(referenceDate, viewMode);
  }, [referenceDate, viewMode, trendRange, logs]);
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
      color: habit?.color || 'bg-indigo-500',
      icon: habit?.icon || 'Target',
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
      log_created_date: getAttributedDate(new Date()),
      color: habit?.color || 'bg-indigo-500',
      icon: habit?.icon || 'Target'
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

  const handleAddHabit = async (name: string, color: string, icon: string = 'Target') => {
    if (!session?.user || !supabase) return;
    const userId = session.user.id;
    const { error } = await supabase.from('habits').insert([{
      name, 
      habit_name: name, 
      user_name: currentUserNickname,
      log_created_date: getAttributedDate(new Date()), 
      icon, 
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

  const handleUpdateHabit = async (id: string, updates: { name?: string; color?: string; icon?: string }) => {
    if (!supabase || !session?.user) return;
    
    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error("Error updating habit:", error);
      throw error; 
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
          <h1 className="text-3xl font-black text-white">Be Consistent</h1>
          <p className="text-[10px] text-slate-500 font-medium italic">Show up, even if you really don't want to.</p>
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
                else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + dir);
                setReferenceDate(newDate);
            }} 
            onViewChange={setViewMode} 
            filteredHabitName={habits.find(h => h.id === selectedHabitId)?.name}
            trendRange={trendRange}
            onTrendRangeChange={setTrendRange}
            trendGrouping={trendGrouping}
            onTrendGroupingChange={setTrendGrouping}
          />
          
          <HabitSplitGrid 
            habits={habits} 
            logs={logs} 
            activePeriodDates={activePeriodDates} 
            selectedHabitId={selectedHabitId} 
            onSelectHabit={setSelectedHabitId} 
          />

          <FriendsSection 
            friends={friends}
            hasNewRequests={receivedRequests.length > 0}
            onAddFriend={() => setShowAddFriendModal(true)}
            onViewRequests={() => setShowRequestsModal(true)}
            onSelectFriend={(friend) => {
              setSelectedFriend(friend);
              setCurrentView('friend_view');
            }}
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
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit} 
          onBack={() => setCurrentView('dashboard')} 
        />
      )}

      {currentView === 'friend_view' && selectedFriend && (
        <FriendDashboardView 
          friend={selectedFriend}
          onBack={() => setCurrentView('dashboard')}
          onRemoveFriend={removeFriend}
        />
      )}
      
      {showAddFriendModal && (
        <AddFriendModal 
          onClose={() => setShowAddFriendModal(false)}
          onSendRequest={sendFriendRequest}
        />
      )}

      {showRequestsModal && (
        <FriendRequestsModal 
          received={receivedRequests}
          sent={sentRequests}
          onAccept={acceptFriendRequest}
          onDecline={declineFriendRequest}
          onCancel={declineFriendRequest}
          onClose={() => setShowRequestsModal(false)}
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