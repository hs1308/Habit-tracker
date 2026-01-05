
import React, { useState } from 'react';
import { Habit, HabitLog } from '../types';
import { formatDuration, getDayName } from '../utils/dateUtils';
import { Trash2, Pencil, ChevronLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
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

  // Sort logs by start time descending
  const sortedLogs = [...logs].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Activity Logs</h2>
      </div>

      {sortedLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Clock size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">No activity recorded yet</h3>
          <p className="text-slate-500 text-sm">Start a timer or record past activity to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {sortedLogs.map((log) => {
            const habit = habits.find(h => h.id === log.habit_id);
            const date = new Date(log.start_time);
            
            return (
              <div 
                key={log.id} 
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${habit?.color || 'bg-slate-700'} bg-opacity-20 flex items-center justify-center text-indigo-400`}>
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-100">{habit?.name || 'Deleted Habit'}</p>
                      <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        {getDayName(log.attributed_date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right mr-3">
                    <p className="font-mono font-bold text-lg text-indigo-400">{formatDuration(log.duration_seconds)}</p>
                  </div>
                  <button 
                    onClick={() => setEditingLog(log)}
                    className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteLog(log.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
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
