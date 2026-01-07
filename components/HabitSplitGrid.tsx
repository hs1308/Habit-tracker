
import React, { useMemo } from 'react';
import { Habit, HabitLog } from '../types';
import { formatDuration } from '../utils/dateUtils';
import { Book, Dumbbell, Code, Brain, Target, Coffee, Music, Camera } from 'lucide-react';

interface HabitSplitGridProps {
  habits: Habit[];
  logs: HabitLog[];
  activePeriodDates: string[];
  selectedHabitId: string | null;
  onSelectHabit: (id: string | null) => void;
}

const ICON_MAP: Record<string, any> = {
  Reading: Book,
  Exercising: Dumbbell,
  Building: Code,
  Learning: Brain,
  Applying: Target,
  Focusing: Coffee,
  Creative: Camera,
  Music: Music,
};

const HabitSplitGrid: React.FC<HabitSplitGridProps> = ({ 
  habits, 
  logs, 
  activePeriodDates, 
  selectedHabitId, 
  onSelectHabit 
}) => {
  const habitStats = useMemo(() => {
    // Process all habits to calculate duration for the period
    const stats = habits.map(habit => {
      const habitLogs = logs.filter(log => 
        log.habit_id === habit.id && 
        activePeriodDates.includes(log.attributed_date)
      );
      const totalSeconds = habitLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
      return {
        ...habit,
        totalSeconds
      };
    });

    // Filter Logic:
    // 1. Show the habit if it is NOT deleted.
    // 2. Show the habit if it IS deleted BUT had activity in the selected period.
    return stats
      .filter(h => !h.deleted_at || h.totalSeconds > 0)
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [habits, logs, activePeriodDates]);

  return (
    <div className="mt-8 pb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Activity Split</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {habitStats.map(habit => {
          const Icon = ICON_MAP[habit.icon] || Target;
          const isSelected = selectedHabitId === habit.id;
          const isDeleted = !!habit.deleted_at;
          
          return (
            <div 
              key={habit.id}
              onClick={() => onSelectHabit(isSelected ? null : habit.id)}
              className={`bg-slate-900 border p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
                isSelected 
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                  : 'border-slate-800 hover:bg-slate-800/80'
              } ${habit.totalSeconds === 0 && !isSelected ? 'opacity-50' : ''}`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 ${habit.color} bg-opacity-20 text-${habit.color.split('-')[1]}-400`}>
                <Icon size={22} />
              </div>
              <div>
                <p className={`text-2xl font-bold mb-1 ${isSelected ? 'text-indigo-400' : 'text-slate-100'}`}>
                  {formatDuration(habit.totalSeconds)}
                </p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {habit.name}
                  </p>
                  {isDeleted && (
                    <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                      Archived
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitSplitGrid;
