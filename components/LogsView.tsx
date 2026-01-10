
import React, { useState, useMemo } from 'react';
import { Habit, HabitLog } from '../types';
import { formatDuration, getDayName, getStartOfWeek, getEndOfWeek, getAttributedDate } from '../utils/dateUtils';
import { Trash2, Pencil, ChevronLeft, Calendar as CalendarIcon, Clock, Filter, X } from 'lucide-react';
import RecordActivityModal from './RecordActivityModal';

interface LogsViewProps {
  logs: HabitLog[];
  habits: Habit[];
  onDeleteLog: (id: string) => void;
  onUpdateLog: (logId: string, habitId: string, startTime: string, endTime: string) => void;
  onBack: () => void;
}

const LogsView: React.FC<LogsViewProps> = ({ logs, habits, onDeleteLog, onUpdateLog, onBack }) => {
  const [editingLog, setEditingLog] = useState<HabitLog | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Default range: Current Week (Sun to Sat)
  const [filterStart, setFilterStart] = useState<string>(getAttributedDate(getStartOfWeek(new Date())));
  const [filterEnd, setFilterEnd] = useState<string>(getAttributedDate(getEndOfWeek(new Date())));

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      return log.attributed_date >= filterStart && log.attributed_date <= filterEnd;
    }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [logs, filterStart, filterEnd]);

  const formatDateRangeLabel = () => {
    const start = new Date(filterStart + 'T00:00:00');
    const end = new Date(filterEnd + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">Activity Logs</h2>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date Range</span>
            <span className="text-sm font-bold text-indigo-400">{formatDateRangeLabel()}</span>
          </div>
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`p-3 rounded-2xl border transition-all ${showDatePicker ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <CalendarIcon size={20} />
          </button>
        </div>
      </div>

      {showDatePicker && (
        <div className="mb-8 p-6 bg-slate-900 border border-indigo-500/20 rounded-[2rem] animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">From</label>
              <input 
                type="date" 
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="hidden sm:block text-slate-700 mt-6">
              <ChevronLeft className="rotate-180" size={20} />
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">To</label>
              <input 
                type="date" 
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowDatePicker(false)}
              className="mt-6 p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Clock size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">No logs for this period</h3>
          <p className="text-slate-500 text-sm">Adjust your date range or record activity to see logs here.</p>
          <button 
            onClick={() => {
              setFilterStart(getAttributedDate(getStartOfWeek(new Date())));
              setFilterEnd(getAttributedDate(getEndOfWeek(new Date())));
            }}
            className="mt-6 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-300 transition-colors"
          >
            Reset to This Week
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {filteredLogs.map((log) => {
            const habit = habits.find(h => h.id === log.habit_id);
            const startDate = new Date(log.start_time);
            const endDate = new Date(log.end_time);
            
            const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

            return (
              <div 
                key={log.id} 
                className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex items-center justify-between group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${habit?.color || 'bg-slate-700'} bg-opacity-20 flex items-center justify-center text-indigo-400 shadow-inner`}>
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-100">{habit?.name || 'Deleted Habit'}</p>
                      <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg uppercase font-black tracking-tighter">
                        {getDayName(log.attributed_date)}
                      </span>
                    </div>
                    <div className="flex flex-col mt-0.5">
                      <p className="text-xs text-slate-400 font-medium">
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-indigo-500/80 font-bold uppercase tracking-wider">
                        {formatTime(startDate)} — {formatTime(endDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right mr-3">
                    <p className="font-mono font-black text-xl text-indigo-400">{formatDuration(log.duration_seconds)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => setEditingLog(log)}
                      className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Delete this log permanently?')) {
                          onDeleteLog(log.id);
                        }
                      }}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingLog && (
        <RecordActivityModal 
          habits={habits} 
          initialLog={editingLog} 
          onClose={() => setEditingLog(null)} 
          onSave={(habitId, start, end, id) => {
            if (id) onUpdateLog(id, habitId, start, end);
            setEditingLog(null);
          }}
        />
      )}
    </div>
  );
};

export default LogsView;
