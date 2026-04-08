
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Rectangle, LineChart, Line } from 'recharts';
import { getDayName, formatDuration, getPeriodLabel, getCalendarGrid, getAttributedDate } from '../utils/dateUtils';
import { HabitLog, Habit } from '../types';
import { ChevronLeft, ChevronRight, LayoutGrid, BarChart2, TrendingUp } from 'lucide-react';
import { COLOR_MAP } from '../constants';

interface WeeklyChartProps {
  logs: HabitLog[];
  habits: Habit[];
  activePeriodDates: string[];
  referenceDate: Date;
  viewMode: 'week' | 'month' | 'more';
  selectedHabitId?: string | null;
  onNavigate: (direction: number) => void;
  onViewChange: (mode: 'week' | 'month' | 'more') => void;
  filteredHabitName?: string;
  trendRange: 30 | 60 | 90 | 'lifetime';
  onTrendRangeChange: (range: 30 | 60 | 90 | 'lifetime') => void;
  trendGrouping: 'week' | 'month';
  onTrendGroupingChange: (grouping: 'week' | 'month') => void;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  logs, 
  habits,
  activePeriodDates, 
  referenceDate, 
  viewMode, 
  selectedHabitId,
  onNavigate, 
  onViewChange,
  filteredHabitName,
  trendRange,
  onTrendRangeChange,
  trendGrouping,
  onTrendGroupingChange
}) => {
  const [viewType, setViewType] = useState<'total' | 'split'>('total');
  const [breakdownDay, setBreakdownDay] = useState<string | null>(null);
  
  const pointerStart = useRef<{ x: number, y: number } | null>(null);
  const didMove = useRef(false);

  useEffect(() => {
    if (selectedHabitId) setViewType('total');
  }, [selectedHabitId]);

  const filteredLogs = useMemo(() => {
    if (!selectedHabitId) return logs;
    return logs.filter(log => log.habit_id === selectedHabitId);
  }, [logs, selectedHabitId]);

  const firstLogDate = useMemo(() => {
    if (logs.length === 0) return null;
    const allDates = logs.map(l => new Date(l.attributed_date).getTime());
    const d = new Date(Math.min(...allDates));
    d.setHours(0,0,0,0);
    return d;
  }, [logs]);

  const totalPeriodSeconds = useMemo(() => {
    if (viewMode === 'more') {
      let startDate: Date;
      const now = new Date();
      now.setHours(0,0,0,0);

      if (trendRange === 'lifetime') {
        if (!firstLogDate) return 0;
        startDate = new Date(firstLogDate);
      } else {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - trendRange);
        if (firstLogDate && firstLogDate > startDate) {
          startDate = new Date(firstLogDate);
        }
      }
      startDate.setHours(0,0,0,0);
      return filteredLogs
        .filter(log => new Date(log.attributed_date) >= startDate)
        .reduce((sum, log) => sum + log.duration_seconds, 0);
    }
    return filteredLogs
      .filter(log => activePeriodDates.includes(log.attributed_date))
      .reduce((sum, log) => sum + log.duration_seconds, 0);
  }, [filteredLogs, activePeriodDates, viewMode, trendRange, logs, firstLogDate]);

  // STABLE SORTING: Alphabetical sort ensures the stack order is identical every time.
  const activeHabitIdsInPeriod = useMemo(() => {
    const ids = new Set<string>();
    filteredLogs.forEach(log => {
      if (activePeriodDates.includes(log.attributed_date)) ids.add(log.habit_id);
    });
    return Array.from(ids).sort();
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

  const trendChartData = useMemo(() => {
    if (viewMode !== 'more') return [];
    
    let startDate: Date;
    const now = new Date();
    now.setHours(0,0,0,0);

    if (trendRange === 'lifetime') {
      if (!firstLogDate) return [];
      startDate = new Date(firstLogDate);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - trendRange);
      if (firstLogDate && firstLogDate > startDate) {
        startDate = new Date(firstLogDate);
      }
    }
    startDate.setHours(0,0,0,0);

    const endDate = new Date();
    endDate.setHours(23,59,59,999);

    // Pre-group logs by date for O(N) lookup instead of O(N*M)
    const logsByDate: Record<string, HabitLog[]> = {};
    filteredLogs.forEach(log => {
      if (!logsByDate[log.attributed_date]) logsByDate[log.attributed_date] = [];
      logsByDate[log.attributed_date].push(log);
    });

    const rawData = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = getAttributedDate(curr);
      const dayLogs = logsByDate[dateStr] || [];
      const totalSeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      
      rawData.push({
        date: dateStr,
        totalSeconds,
        dayLogs
      });
      curr.setDate(curr.getDate() + 1);
    }

    const grouped: Record<string, { totalSeconds: number; breakdown: Record<string, number> }> = {};
    rawData.forEach(d => {
      const date = new Date(d.date);
      let key: string;
      if (trendGrouping === 'week') {
        // Find Monday of that week
        const day = date.getDay();
        const diff = date.getDate() - (day === 0 ? 6 : day - 1);
        const monday = new Date(date.getFullYear(), date.getMonth(), diff);
        key = getAttributedDate(monday);
      } else {
        // Month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }
      
      if (!grouped[key]) {
        grouped[key] = { totalSeconds: 0, breakdown: {} };
      }
      grouped[key].totalSeconds += d.totalSeconds;
      
      // Add breakdown for this day to the group
      d.dayLogs.forEach(log => {
        grouped[key].breakdown[log.habit_id] = (grouped[key].breakdown[log.habit_id] || 0) + log.duration_seconds;
      });
    });

    // Fill missing periods with 0 to ensure linear X-axis and fix "repeating/uneven" look
    const fillCurr = new Date(startDate);
    while (fillCurr <= endDate) {
      let key: string;
      if (trendGrouping === 'week') {
        const day = fillCurr.getDay();
        const diff = fillCurr.getDate() - (day === 0 ? 6 : day - 1);
        const monday = new Date(fillCurr.getFullYear(), fillCurr.getMonth(), diff);
        key = getAttributedDate(monday);
        // Move to next week
        fillCurr.setDate(fillCurr.getDate() + 7);
      } else {
        key = `${fillCurr.getFullYear()}-${String(fillCurr.getMonth() + 1).padStart(2, '0')}-01`;
        // Move to next month
        fillCurr.setMonth(fillCurr.getMonth() + 1);
      }
      if (!(key in grouped)) {
        grouped[key] = { totalSeconds: 0, breakdown: {} };
      }
    }

    const nowLocal = new Date();
    nowLocal.setHours(0, 0, 0, 0);

    const data = Object.entries(grouped).sort().map(([dateStr, groupData]) => {
      const parts = dateStr.split('-').map(Number);
      const keyDate = new Date(parts[0], parts[1] - 1, parts[2]);
      let isOngoing = false;
      let estimatedSeconds = groupData.totalSeconds;

      if (trendGrouping === 'week') {
        const monday = new Date(keyDate);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        if (nowLocal >= monday && nowLocal <= sunday) {
          isOngoing = true;
          // Calculate days passed in this week (Mon=1, Tue=2, etc.)
          const diffMs = nowLocal.getTime() - monday.getTime();
          const daysPassed = Math.round(diffMs / (24 * 3600 * 1000)) + 1;
          estimatedSeconds = (groupData.totalSeconds / Math.max(1, daysPassed)) * 7;
        }
      } else {
        const firstDay = new Date(keyDate);
        const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
        if (nowLocal >= firstDay && nowLocal <= lastDay) {
          isOngoing = true;
          const daysPassed = nowLocal.getDate();
          const totalDays = lastDay.getDate();
          estimatedSeconds = (groupData.totalSeconds / Math.max(1, daysPassed)) * totalDays;
        }
      }

      return {
        date: dateStr,
        totalSeconds: isOngoing ? estimatedSeconds : groupData.totalSeconds,
        actualSeconds: groupData.totalSeconds,
        isEstimated: isOngoing,
        breakdown: groupData.breakdown
      };
    });

    return data.map((d, i) => {
      const isLast = i === data.length - 1;
      const isSecondLast = i === data.length - 2;
      
      let solidHours = null;
      let dashedHours = null;

      if (!d.isEstimated) {
        solidHours = parseFloat((d.actualSeconds / 3600).toFixed(2));
        // If the NEXT point is estimated, this point also needs dashedHours to start the dashed line
        if (isSecondLast && data[i+1].isEstimated) {
          dashedHours = solidHours;
        }
      } else {
        dashedHours = parseFloat((d.totalSeconds / 3600).toFixed(2));
      }

      return {
        ...d,
        solidHours,
        dashedHours,
        totalHours: d.isEstimated ? d.totalSeconds / 3600 : d.actualSeconds / 3600
      };
    });
  }, [filteredLogs, viewMode, trendRange, logs, firstLogDate, trendGrouping]);

  // Removed solidTrendData and dashedTrendData as we now use a single data source

  const trendTicks = useMemo(() => {
    if (trendChartData.length < 2) return [];
    const count = Math.min(trendChartData.length, 5);
    const result = [];
    for (let i = 0; i < count; i++) {
      const index = Math.floor((i * (trendChartData.length - 1)) / (count - 1));
      result.push(trendChartData[index].date);
    }
    return result;
  }, [trendChartData]);

  const formatTrendXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    const totalDays = trendChartData.length;
    
    if (trendGrouping === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    if (totalDays > 547) { // 1.5 years
      return date.getFullYear().toString();
    } else if (totalDays > 90) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Custom shape for "Split" view: Ensures curves only on the true top/bottom of the day's entire stack.
  const renderStackedBar = (props: any) => {
    const { x, y, width, height, payload, dataKey } = props;
    if (!height || height <= 0) return null;

    const currentDayActiveKeys = activeHabitIdsInPeriod.filter(id => (payload[id] || 0) > 0);
    const isBottom = dataKey === currentDayActiveKeys[0];
    const isTop = dataKey === currentDayActiveKeys[currentDayActiveKeys.length - 1];
    const r = 4; 
    const radius: [number, number, number, number] = [
      isTop ? r : 0,
      isTop ? r : 0,
      isBottom ? r : 0,
      isBottom ? r : 0
    ];

    return <Rectangle {...props} radius={radius} />;
  };

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
                  
                  // Fallback to color from logs if habit not found in current habits array
                  const fallbackColor = filteredLogs.find(l => l.habit_id === habitId)?.color || 'bg-indigo-500';
                  const displayColor = habit?.color || fallbackColor;
                  const displayName = habit?.name || filteredLogs.find(l => l.habit_id === habitId)?.habit_name || 'Unknown';

                  return (
                    <div key={habitId} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0`} style={{ backgroundColor: COLOR_MAP[displayColor] || '#6366f1' }} />
                        <span className="text-[11px] font-medium text-slate-300 truncate">{displayName}</span>
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
      const fallbackColor = filteredLogs.find(l => l.habit_id === hid)?.color || 'bg-indigo-500';
      const fallbackName = filteredLogs.find(l => l.habit_id === hid)?.habit_name || 'Unknown';
      const s = dayLogs.filter(l => l.habit_id === hid).reduce((sum, l) => sum + l.duration_seconds, 0);
      return { 
        id: hid, 
        name: h?.name || fallbackName, 
        color: h?.color || fallbackColor, 
        seconds: s 
      };
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
        
        <div className="flex flex-col items-end gap-3 ml-auto w-full sm:w-auto">
          <div className="flex flex-wrap justify-end gap-3 items-center w-full">
            {viewMode === 'week' && !selectedHabitId && (
              <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setViewType('total')} className={`p-1.5 rounded-lg transition-all flex items-center gap-2 px-3 ${viewType === 'total' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><span className="text-[10px] font-black uppercase">Total</span></button>
                <button onClick={() => setViewType('split')} className={`p-1.5 rounded-lg transition-all flex items-center gap-2 px-3 ${viewType === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}><span className="text-[10px] font-black uppercase">Split</span></button>
              </div>
            )}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button onClick={() => onViewChange('week')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>Week</button>
              <button onClick={() => onViewChange('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>Month</button>
              <button onClick={() => onViewChange('more')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'more' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}>More</button>
            </div>
          </div>
          {viewMode !== 'more' ? (
            <div className="flex items-center gap-4">
               <button onClick={() => onNavigate(-1)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><ChevronLeft size={18} /></button>
               <span className="text-sm font-semibold text-slate-300 min-w-[140px] text-center">{getPeriodLabel(referenceDate, viewMode)}</span>
               <button onClick={() => onNavigate(1)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><ChevronRight size={18} /></button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-3 items-center w-full">
              <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {['week', 'month'].map((g) => {
                  if (g === 'month' && trendRange === 30) return null;
                  return (
                    <button 
                      key={g}
                      onClick={() => onTrendGroupingChange(g as any)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${trendGrouping === g ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {[30, 60, 90, 'lifetime'].map((range) => (
                  <button 
                    key={range}
                    onClick={() => onTrendRangeChange(range as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${trendRange === range ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {range === 'lifetime' ? 'All' : `${range}d`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} interval={0} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                orientation="left" 
                width={32} 
                tickCount={4} 
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              {viewType === 'total' ? (
                <Bar dataKey="totalHours" radius={[4, 4, 4, 4]}>
                    {weekChartData.map((entry, index) => {
                      const habit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
                      const fallbackColor = selectedHabitId ? filteredLogs.find(l => l.habit_id === selectedHabitId)?.color : null;
                      const displayColor = habit?.color || fallbackColor || 'bg-indigo-500';
                      const fillColor = COLOR_MAP[displayColor] || '#6366f1';
                      return <Cell key={`cell-${index}`} fill={entry.totalHours > 0 ? fillColor : '#334155'} />;
                    })}
                </Bar>
              ) : (
                <>
                  {/* Anchor Bar: Forces Recharts to render the Y-axis when no habits have logs yet */}
                  {activeHabitIdsInPeriod.length === 0 && (
                    <Bar dataKey="totalHours" hide />
                  )}
                  {activeHabitIdsInPeriod.map((habitId) => {
                    const habit = habits.find(h => h.id === habitId);
                    const fallbackColor = filteredLogs.find(l => l.habit_id === habitId)?.color || 'bg-indigo-500';
                    const color = COLOR_MAP[habit?.color || fallbackColor] || '#6366f1';
                    return <Bar key={habitId} dataKey={habitId} stackId="a" fill={color} shape={renderStackedBar} />;
                  })}
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'more' && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData} margin={{ top: 10, right: 8, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                ticks={trendTicks}
                tickFormatter={formatTrendXAxis}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                orientation="left" 
                width={32} 
                tickCount={4} 
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const breakdownEntries = Object.entries(data.breakdown || {})
                      .map(([id, seconds]) => {
                        const habit = habits.find(h => h.id === id);
                        const fallbackColor = filteredLogs.find(l => l.habit_id === id)?.color || 'bg-indigo-500';
                        const fallbackName = filteredLogs.find(l => l.habit_id === id)?.habit_name || 'Unknown';
                        return { 
                          id, 
                          name: habit?.name || fallbackName, 
                          color: habit?.color || fallbackColor, 
                          seconds: seconds as number 
                        };
                      })
                      .filter(b => b.seconds > 0)
                      .sort((a, b) => b.seconds - a.seconds);

                    return (
                      <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-2xl min-w-[180px] animate-in zoom-in-90 fade-in duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          {trendGrouping === 'week' ? `Week of ${data.date}` : `Month of ${data.date.substring(0, 7)}`}
                        </p>
                        
                        <div className="space-y-2">
                          {breakdownEntries.map(b => (
                            <div key={b.id} className="flex items-center justify-between gap-3 text-left">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[b.color || 'bg-indigo-500'] || '#6366f1' }} />
                                <span className="text-[11px] font-bold text-slate-200 truncate">{b.name}</span>
                              </div>
                              <span className="text-[11px] font-black text-white whitespace-nowrap">{formatDuration(b.seconds)}</span>
                            </div>
                          ))}
                          {breakdownEntries.length === 0 && (
                            <p className="text-[11px] text-slate-500 italic">No activity recorded</p>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-[11px] font-black text-slate-500 uppercase">
                            {data.isEstimated ? 'Projected Total' : 'Total'}
                          </span>
                          <span className="text-[11px] font-black text-indigo-400">
                            {formatDuration(data.totalSeconds)}
                          </span>
                        </div>

                        {data.isEstimated && (
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase italic opacity-70">Actual So Far</span>
                            <span className="text-[9px] font-black text-slate-400 opacity-70">{formatDuration(data.actualSeconds)}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="solidHours" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={trendChartData.length < 40}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={true}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="dashedHours" 
                stroke="#6366f1" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={trendChartData.length < 40}
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={true}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="w-full relative">
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-[10px] uppercase font-bold text-slate-600 mb-2">{d}</div>)}
            {calendarGrid.map((item, idx) => {
              if (!item) return <div key={`empty-${idx}`} className="aspect-square" />;
              const dayLogs = filteredLogs.filter(log => log.attributed_date === item.date);
              const daySeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
              const hasActivity = daySeconds > 0;
              const scaleFactor = hasActivity ? 0.6 + ((daySeconds / maxDaySeconds) * 1.2) : 0;
              const habit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
              const fallbackColor = selectedHabitId ? filteredLogs.find(l => l.habit_id === selectedHabitId)?.color : null;
              const circleColor = COLOR_MAP[habit?.color || fallbackColor || 'bg-indigo-500'] || '#6366f1';

              return (
                <div 
                  key={item.date} 
                  className="relative aspect-square flex items-center justify-center cursor-pointer select-none touch-none"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={(e) => onPointerUp(e, item.date)}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setBreakdownDay(item.date); }}
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
                      <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between"><span className="text-[11px] font-black text-slate-500 uppercase">Total</span><span className="text-[11px] font-black text-indigo-400">{formatDuration(daySeconds)}</span></div>
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
