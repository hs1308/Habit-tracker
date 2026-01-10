import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { getAttributedDate } from '../utils/dateUtils';

interface RecordActivityModalProps {
  habits: Habit[];
  onClose: () => void;
  onSave: (habitId: string, startTime: string, endTime: string, logId?: string) => void;
  initialLog?: HabitLog;
}

const RecordActivityModal: React.FC<RecordActivityModalProps> = ({ habits, onClose, onSave, initialLog }) => {
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialLog) {
      const start = new Date(initialLog.start_time);
      const end = new Date(initialLog.end_time);
      
      setSelectedHabitId(initialLog.habit_id);
      // Use local date instead of UTC ISO string to prevent date shift
      setStartDate(getAttributedDate(start));
      
      setStartHour(start.getHours().toString().padStart(2, '0'));
      setEndHour(end.getHours().toString().padStart(2, '0'));
      
      const sMin = Math.round(start.getMinutes() / 5) * 5;
      const eMin = Math.round(end.getMinutes() / 5) * 5;
      
      setStartMin((sMin >= 60 ? 55 : sMin).toString().padStart(2, '0'));
      setEndMin((eMin >= 60 ? 55 : eMin).toString().padStart(2, '0'));
    } else {
      const now = new Date();
      setSelectedHabitId(habits[0]?.id || '');
      setStartDate(getAttributedDate(now));
      // Round down to current hour
      const currentHour = now.getHours().toString().padStart(2, '0');
      setStartHour(currentHour);
      setStartMin('00');
      setEndHour(currentHour);
      setEndMin('00');
    }
  }, [initialLog, habits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create dates using local time parts
    const startDateTime = new Date(`${startDate}T${startHour}:${startMin}:00`);
    let endDateTime = new Date(`${startDate}T${endHour}:${endMin}:00`);

    // If end time is before start time, assume it crosses midnight
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const sixHoursMs = 6 * 60 * 60 * 1000;
    
    if (durationMs > sixHoursMs) {
      alert("Session cannot exceed 6 hours. Please split the entry.");
      return;
    }

    onSave(selectedHabitId, startDateTime.toISOString(), endDateTime.toISOString(), initialLog?.id);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const handleDateClick = (e?: React.MouseEvent) => {
    if (dateInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch (e) {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const TimeSelector = ({ 
    label, 
    hour, 
    min, 
    setHour, 
    setMin 
  }: { 
    label: string, 
    hour: string, 
    min: string, 
    setHour: (v: string) => void, 
    setMin: (v: string) => void 
  }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select 
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-10 appearance-none text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
        </div>
        <span className="flex items-center text-slate-500 font-bold">:</span>
        <div className="relative flex-1">
          <select 
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-10 appearance-none text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold">{initialLog ? 'Edit Activity' : 'Record Activity'}</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected Habit</label>
            <div className="grid grid-cols-2 gap-2">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => setSelectedHabitId(habit.id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left truncate flex items-center gap-2 ${
                    selectedHabitId === habit.id 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                      : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${habit.color}`} />
                  {habit.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Activity Date</label>
            <div 
              className="relative group cursor-pointer"
              onClick={() => handleDateClick()}
            >
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:scale-110 transition-transform z-10" size={18} />
              <input 
                ref={dateInputRef}
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation(); // Let handleDateClick deal with it
                  handleDateClick();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white font-black text-lg cursor-pointer transition-all hover:bg-slate-700/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TimeSelector 
              label="Start Time" 
              hour={startHour} 
              min={startMin} 
              setHour={setStartHour} 
              setMin={setStartMin} 
            />
            <TimeSelector 
              label="End Time" 
              hour={endHour} 
              min={endMin} 
              setHour={setHour => setEndHour(setHour)} 
              setMin={setMin => setEndMin(setMin)} 
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            {initialLog ? 'Update Log' : 'Add Log'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecordActivityModal;