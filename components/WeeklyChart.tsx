
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDayName, formatDuration, getPeriodLabel, getCalendarGrid } from '../utils/dateUtils';
import { HabitLog, Habit } from '../types';
import { ChevronLeft, ChevronRight, LayoutGrid, BarChart2 } from 'lucide-react';

interface WeeklyChartProps {
  logs: HabitLog[];
  habits: Habit[];
  activePeriodDates: string[];
  referenceDate: Date;
  viewMode: 'week' | 'month';
  selectedHabitId?: string | null;
  onNavigate: (direction: number) => void;
  onViewChange: (mode: 'week' | 'month') => void;
  filteredHabitName?: string;
}

const COLOR_MAP: Record<string, string> = {
  'bg-indigo-500': '#6366f1',
  'bg-emerald-500': '#10b981',
  'bg-purple-500': '#a855f7',
  'bg-orange-500': '#f97316',
  'bg-blue-500': '#3b82f6',
  'bg-red-500': '#ef4444',
  'bg-pink-500': '#ec4899',
  'bg-amber-500': '#f59e0b',
  'bg-cyan-500': '#06b6d4',
  'bg-rose-500': '#f43f5e',
  'bg-slate-500': '#64748b',
};

const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  logs, 
  habits,
  activePeriodDates, 
  referenceDate, 
  viewMode, 
  selectedHabitId,
  onNavigate, 
  onViewChange,
  filteredHabitName
}) => {
  const [viewType, setViewType] = useState<'total' | 'split'>('total');
  const [breakdownDay, setBreakdownDay] = useState<string | null>(null);
  
  // Ref to track pointer movements for scroll vs tap detection
  const pointerStart = useRef<{ x: number, y: number } | null>(null);
  const didMove = useRef(false);

  useEffect(() => {
    if (selectedHabitId) setViewType('total');
  }, [selectedHabitId]);

  const filteredLogs = useMemo(() => {
    if (!selectedHabitId) return logs;
    return logs.filter(log => log.habit_id === selectedHabitId);
  }, [logs, selectedHabitId]);

  const totalPeriodSeconds = useMemo(() => {
    return filteredLogs
      .filter(log => activePeriodDates.includes(log.attributed_date))
      .reduce((sum, log) => sum + log.duration_seconds, 0);
  }, [filteredLogs, activePeriodDates]);

  const activeHabitIdsInPeriod = useMemo(() => {
    const ids = new Set<string>();
    filteredLogs.forEach(log => {
      if (activePeriodDates.includes(log.attributed_date)) ids.add(log.habit_id);
    });
    return Array.from(ids);
  }, [filteredLogs, activePeriodDates]);

  const weekChartData = useMemo(() => {
    if (viewMode !== 'week') return [];
    return activePeriodDates.map(date => {
      const dayLogs = filteredLogs.filter(log => log.attributed_date === date);
      const totalSeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      const data: any = {
        date,
        name: getDayName(date),
        totalHours: parseFloat((totalSeconds / 3600).toFixed(2)),
        totalSeconds: totalSeconds
      };
      activeHabitIdsInPeriod.forEach(habitId => {
        const habitLogs = dayLogs.filter(l => l.habit_id === habitId);
        const habitSeconds = habitLogs.reduce((sum, l) => sum + l.duration_seconds, 0);
        data[habitId] = parseFloat((habitSeconds / 3600).toFixed(2));
      });
      return data;
    });
  }, [filteredLogs, activePeriodDates, viewMode, activeHabitIdsInPeriod]);

  const calendarGrid = useMemo(() => {
    if (viewMode !== 'month') return [];
    return getCalendarGrid(referenceDate);
  }, [referenceDate, viewMode]);

  const maxDaySeconds = useMemo(() => {
    if (viewMode !== 'month') return 0;
    let max = 0;
    activePeriodDates.forEach(date => {
      const dayLogs = filteredLogs.filter(log => log.attributed_date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      if (total > max) max = total;
    });
    return max || 1;
  }, [filteredLogs, activePeriodDates, viewMode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl min-w-[140px]">
          <p className="text-slate-400 text-[10px] mb-2 font-bold uppercase tracking-widest">{getDayName(data.date)} {data.date}</p>
          {viewType === 'total' ? (
            <p className="text-indigo-400 font-bold text-lg">{formatDuration(data.totalSeconds)}</p>
          ) : (
            <div className="space-y-2">
              {activeHabitIdsInPeriod.map(habitId => {
                const habitVal = data[habitId] || 0;
                if (habitVal <= 0) return null;
                const habit = habits.find(h => h.id === habitId);
                return (
                  <div key={habitId} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ backgroundColor: COLOR_MAP[habit?.color || 'bg-indigo-500'] || '#6366f1' }} />
                      <span className="text-[11px] font-medium text-slate-300 truncate">{habit?.name || 'Unknown'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">{formatDuration(habitVal * 3600)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getDayBreakdown = (date: string) => {
    const dayLogs = filteredLogs.filter(log => log.attributed_date === date);
    return activeHabitIdsInPeriod.map(hid => {
      const h = habits.find(h => h.id === hid);
      const s = dayLogs.filter(l => l.habit_id === hid).reduce((sum, l) => sum + l.duration_seconds, 0);
      return { id: hid, name: h?.name, color: h?.color, seconds: s };
    }).filter(b => b.seconds > 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    didMove.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dist = Math.sqrt(Math.pow(e.clientX - pointerStart.current.x, 2) + Math.pow(e.clientY - pointerStart.current.y, 2));
    if (dist > 6) didMove.current = true;
  };

  const onPointerUp = (e: React.PointerEvent, date: string) => {
    if (!didMove.current) {
      setBreakdownDay(prev => prev === date ? null : date);
    }
    pointerStart.current = null;
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-2">
            {filteredHabitName ? <span className="text-indigo-400 font-bold">{filteredHabitName}</span> : 'Aggregate'} Activity
          </h3>
          <p className="text-3xl font-bold text-white tracking-tight">{formatDuration(totalPeriodSeconds)}</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-4">
            {viewMode === 'week' && !selectedHabitId && (
              <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setViewType('total')} className={`p-1.5 rounded-lg transition-all flex items-center gap-2 px-3 ${viewType === 'total' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><BarChart2 size={14} /><span className="text-[10px] font-black uppercase">Total</span></button>
                <button onClick={() => setViewType('split')} className={`p-1.5 rounded-lg transition-all flex items-center gap-2 px-3 ${viewType === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={14} /><span className="text-[10px] font-black uppercase">Split</span></button>
              </div>
            )}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button onClick={() => onViewChange('week')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>Week</button>
              <button onClick={() => onViewChange('month')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>Month</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => onNavigate(-1)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><ChevronLeft size={18} /></button>
             <span className="text-sm font-semibold text-slate-300 min-w-[140px] text-center">{getPeriodLabel(referenceDate, viewMode)}</span>
             <button onClick={() => onNavigate(1)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 0, right: 8, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} orientation="left" width={40} tickCount={4} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              {viewType === 'total' ? (
                <Bar dataKey="totalHours" radius={[4, 4, 4, 4]}>
                  {weekChartData.map((entry, index) => {
                    const habit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
                    const fillColor = habit ? (COLOR_MAP[habit.color] || '#6366f1') : '#6366f1';
                    return <Cell key={`cell-${index}`} fill={entry.totalHours > 0 ? fillColor : '#334155'} />;
                  })}
                </Bar>
              ) : (
                activeHabitIdsInPeriod.map((habitId, idx) => {
                  const habit = habits.find(h => h.id === habitId);
                  const color = COLOR_MAP[habit?.color || 'bg-indigo-500'] || '#6366f1';
                  return <Bar key={habitId} dataKey={habitId} stackId="a" fill={color} radius={idx === activeHabitIdsInPeriod.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />;
                })
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="w-full relative">
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-[10px] uppercase font-bold text-slate-600 mb-2">{d}</div>)}
            {calendarGrid.map((item, idx) => {
              if (!item) return <div key={`empty-${idx}`} className="aspect-square" />;
              const dayLogs = filteredLogs.filter(log => log.attributed_date === item.date);
              const daySeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
              const hasActivity = daySeconds > 0;
              const scaleFactor = hasActivity ? 0.6 + ((daySeconds / maxDaySeconds) * 1.2) : 0;
              const habit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
              const circleColor = habit ? (COLOR_MAP[habit.color] || '#6366f1') : '#6366f1';

              return (
                <div 
                  key={item.date} 
                  className="relative aspect-square flex items-center justify-center cursor-pointer select-none touch-none"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={(e) => onPointerUp(e, item.date)}
                  onMouseEnter={(e) => { if (e.pointerType === 'mouse') setBreakdownDay(item.date); }}
                  onMouseLeave={() => setBreakdownDay(null)}
                >
                  {hasActivity && (
                    <div className="absolute rounded-full transition-all duration-500 ease-out"
                      style={{ width: '70%', height: '70%', transform: `scale(${scaleFactor})`, zIndex: 0, backgroundColor: `${circleColor}66`, border: `1px solid ${circleColor}33` }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-medium ${hasActivity ? 'text-white font-bold' : 'text-slate-500'}`}>{item.day}</span>
                  {breakdownDay === item.date && hasActivity && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-2xl min-w-[180px] animate-in zoom-in-90 fade-in duration-200 pointer-events-none">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{getDayName(item.date)} {item.date}</p>
                      <div className="space-y-2">
                        {getDayBreakdown(item.date).map(b => (
                          <div key={b.id} className="flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[b.color || 'bg-indigo-500'] || '#6366f1' }} />
                              <span className="text-[11px] font-bold text-slate-200 truncate">{b.name}</span>
                            </div>
                            <span className="text-[11px] font-black text-white whitespace-nowrap">{formatDuration(b.seconds)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between"><span className="text-[9px] font-black text-slate-500 uppercase">Total</span><span className="text-[9px] font-black text-indigo-400">{formatDuration(daySeconds)}</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyChart;
