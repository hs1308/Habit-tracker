
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, User, Loader2 } from 'lucide-react';
import { Profile, Habit, HabitLog } from '../types';
import { supabase } from '../supabase';
import WeeklyChart from './WeeklyChart';
import HabitSplitGrid from './HabitSplitGrid';
import { getPeriodDates, getAttributedDate } from '../utils/dateUtils';

interface FriendDashboardViewProps {
  friend: Profile;
  onBack: () => void;
}

const FriendDashboardView: React.FC<FriendDashboardViewProps> = ({ friend, onBack }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'more'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [trendRange, setTrendRange] = useState<30 | 60 | 90 | 'lifetime'>(30);
  const [trendGrouping, setTrendGrouping] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchFriendData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const [habitsRes, logsRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', friend.id),
          supabase.from('habit_logs').select('*').eq('user_id', friend.id)
        ]);
        if (habitsRes.data) setHabits(habitsRes.data);
        if (logsRes.data) setLogs(logsRes.data);
      } catch (err) {
        console.error("Error fetching friend data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriendData();
  }, [friend.id]);

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
    return getPeriodDates(referenceDate, viewMode as 'week' | 'month');
  }, [referenceDate, viewMode, trendRange, logs]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading {friend.full_name}'s Progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="py-5 flex items-center gap-4 sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl z-40 border-b border-white/5">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20">
            {friend.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{friend.full_name}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">View Only Mode</p>
          </div>
        </div>
      </header>

      <div className="space-y-10">
        <WeeklyChart 
          logs={logs} 
          habits={habits}
          activePeriodDates={activePeriodDates} 
          referenceDate={referenceDate} 
          viewMode={viewMode} 
          onNavigate={(dir) => {
              const newDate = new Date(referenceDate);
              if (viewMode === 'week') newDate.setDate(newDate.getDate() + (dir * 7));
              else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + dir);
              setReferenceDate(newDate);
          }} 
          onViewChange={setViewMode} 
          trendRange={trendRange}
          onTrendRangeChange={setTrendRange}
          trendGrouping={trendGrouping}
          onTrendGroupingChange={setTrendGrouping}
        />
        
        <HabitSplitGrid 
          habits={habits} 
          logs={logs} 
          activePeriodDates={activePeriodDates} 
          selectedHabitId={null}
          onSelectHabit={() => {}} // Read only
        />
      </div>
    </div>
  );
};

export default FriendDashboardView;
