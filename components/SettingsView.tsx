
import React, { useState } from 'react';
import { Habit } from '../types';
import { ChevronLeft, Plus, Trash2, Tag, Palette } from 'lucide-react';

interface SettingsViewProps {
  habits: Habit[];
  onAddHabit: (name: string, color: string) => void;
  onDeleteHabit: (id: string) => void;
  onBack: () => void;
}

const COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 
  'bg-orange-500', 'bg-blue-500', 'bg-red-500', 
  'bg-pink-500', 'bg-amber-500'
];

const SettingsView: React.FC<SettingsViewProps> = ({ habits, onAddHabit, onDeleteHabit, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddHabit(newName.trim(), selectedColor);
      setNewName('');
      setIsAdding(false);
    }
  };

  const activeHabits = habits.filter(h => !h.deleted_at);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">Your Habits</h2>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} /> Add New
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 mb-8 animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Tag size={18} className="text-indigo-400" /> Define New Habit
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Habit Name</label>
              <input 
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Meditating, Piano, Coding..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Palette size={14} /> Brand Color
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all transform active:scale-90 ${color} ${
                      selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                type="submit"
                disabled={!newName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all"
              >
                Create Habit
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {activeHabits.map((habit) => (
          <div 
            key={habit.id} 
            className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between group hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${habit.color} bg-opacity-20 flex items-center justify-center text-${habit.color.split('-')[1]}-400`}>
                <div className="w-3 h-3 rounded-full bg-current" />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-100">{habit.name}</p>
                <p className="text-xs text-slate-500">Active tracking</p>
              </div>
            </div>
            
            <button 
              onClick={() => onDeleteHabit(habit.id)}
              className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Soft-delete habit"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsView;
