
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDayName, formatDuration, getPeriodLabel, getCalendarGrid } from '../utils/dateUtils';
import { HabitLog } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeeklyChartProps {
  logs: HabitLog[];
  activePeriodDates: string[];
  referenceDate: Date;
  viewMode: 'week' | 'month';
  onNavigate: (direction: number) => void;
  onViewChange: (mode: 'week' | 'month') => void;
  filteredHabitName?: string;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ 
  logs, 
  activePeriodDates, 
  referenceDate, 
  viewMode, 
  onNavigate, 
  onViewChange,
  filteredHabitName
}) => {
  // Common calculations
  const totalPeriodSeconds = useMemo(() => {
    return logs
      .filter(log => activePeriodDates.includes(log.attributed_date))
      .reduce((sum, log) => sum + log.duration_seconds, 0);
  }, [logs, activePeriodDates]);

  // Week View Data
  const weekChartData = useMemo(() => {
    if (viewMode !== 'week') return [];
    return activePeriodDates.map(date => {
      const dayLogs = logs.filter(log => log.attributed_date === date);
      const totalSeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      return {
        date,
        name: getDayName(date),
        hours: parseFloat((totalSeconds / 3600).toFixed(2)),
        seconds: totalSeconds
      };
    });
  }, [logs, activePeriodDates, viewMode]);

  // Month View Calendar Grid
  const calendarGrid = useMemo(() => {
    if (viewMode !== 'month') return [];
    return getCalendarGrid(referenceDate);
  }, [referenceDate, viewMode]);

  // Max seconds for bubble scaling in month view
  const maxDaySeconds = useMemo(() => {
    if (viewMode !== 'month') return 0;
    let max = 0;
    activePeriodDates.forEach(date => {
      const dayLogs = logs.filter(log => log.attributed_date === date);
      const total = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      if (total > max) max = total;
    });
    return max || 1; // Avoid divide by zero
  }, [logs, activePeriodDates, viewMode]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 text-xs mb-1 font-medium">{getDayName(data.date)} {data.date}</p>
          <p className="text-indigo-400 font-bold text-lg">{formatDuration(data.seconds)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-2">
            {filteredHabitName ? <span className="text-indigo-400 font-bold">{filteredHabitName}</span> : 'Aggregate'} Activity
          </h3>
          <p className="text-3xl font-bold text-white tracking-tight">{formatDuration(totalPeriodSeconds)}</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => onViewChange('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Week
            </button>
            <button 
              onClick={() => onViewChange('month')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Month
            </button>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={() => onNavigate(-1)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
             >
               <ChevronLeft size={18} />
             </button>
             <span className="text-sm font-semibold text-slate-300 min-w-[140px] text-center">
               {getPeriodLabel(referenceDate, viewMode)}
             </span>
             <button 
              onClick={() => onNavigate(1)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
             >
               <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Week View Content */}
      {viewMode === 'week' && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="hours" radius={[4, 4, 4, 4]}>
                {weekChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.hours > 0 ? '#6366f1' : '#334155'} 
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month View (Bubble Calendar) */}
      {viewMode === 'month' && (
        <div className="w-full">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-4 text-center">
            {/* Day Headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-[10px] uppercase font-bold text-slate-600 mb-2">
                {d}
              </div>
            ))}
            
            {calendarGrid.map((item, idx) => {
              if (!item) return <div key={`empty-${idx}`} className="aspect-square" />;
              
              const dayLogs = logs.filter(log => log.attributed_date === item.date);
              const daySeconds = dayLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
              
              const hasActivity = daySeconds > 0;
              const relativeSize = hasActivity ? (daySeconds / maxDaySeconds) : 0;
              const scaleFactor = hasActivity ? 0.6 + (relativeSize * 1.2) : 0;

              return (
                <div key={item.date} className="relative aspect-square flex items-center justify-center">
                  {hasActivity && (
                    <div 
                      className="absolute rounded-full bg-indigo-500/40 border border-indigo-400/20 backdrop-blur-[2px] pointer-events-none transition-all duration-500 ease-out"
                      style={{ 
                        width: '70%', 
                        height: '70%', 
                        transform: `scale(${scaleFactor})`,
                        zIndex: 0
                      }}
                    />
                  )}
                  <span className={`relative z-10 text-sm font-medium ${hasActivity ? 'text-white' : 'text-slate-500'}`}>
                    {item.day}
                  </span>
                  
                  {hasActivity && (
                    <div className="absolute inset-0 group cursor-pointer z-20">
                      <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded shadow-lg whitespace-nowrap z-50">
                        {formatDuration(daySeconds)}
                      </div>
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
