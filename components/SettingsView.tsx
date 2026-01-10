import React, { useState } from 'react';
import { Habit } from '../types';
import { ChevronLeft, Plus, Trash2, Tag, Palette, CheckCircle2, X, Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  habits: Habit[];
  onAddHabit: (name: string, color: string) => void;
  onDeleteHabit: (id: string) => Promise<void>;
  onBack: () => void;
}

const PRESET_SUGGESTIONS = [
  { name: 'Reading', color: 'bg-blue-500', icon: 'Reading' },
  { name: 'Exercising', color: 'bg-orange-500', icon: 'Exercising' },
  { name: 'Coding', color: 'bg-indigo-500', icon: 'Building' },
  { name: 'Studying', color: 'bg-amber-500', icon: 'Learning' },
  { name: 'Running', color: 'bg-red-500', icon: 'Exercising' },
  { name: 'Work', color: 'bg-slate-500', icon: 'Target' },
  { name: 'Meditating', color: 'bg-emerald-500', icon: 'Focusing' },
  { name: 'Learning', color: 'bg-purple-500', icon: 'Learning' },
  { name: 'Music', color: 'bg-pink-500', icon: 'Music' },
];

const CUSTOM_COLORS = [
  'bg-indigo-500', 
  'bg-emerald-500', 
  'bg-purple-500', 
  'bg-orange-500', 
  'bg-blue-500', 
  'bg-red-500', 
  'bg-pink-500', 
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500'
];

const SettingsView: React.FC<SettingsViewProps> = ({ habits, onAddHabit, onDeleteHabit, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CUSTOM_COLORS[0]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeHabits = habits.filter(h => !h.deleted_at);

  const handleAddPreset = (name: string, color: string) => {
    if (activeHabits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
      alert("You are already tracking this habit.");
      return;
    }
    onAddHabit(name, color);
    setIsAdding(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (activeHabits.some(h => h.name.toLowerCase() === newName.trim().toLowerCase())) {
        alert("This habit already exists.");
        return;
      }
      onAddHabit(newName.trim(), selectedColor);
      setNewName('');
      setShowCustomForm(false);
      setIsAdding(false);
    }
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmingId(null);
    try {
      await onDeleteHabit(id);
    } catch (err) {
      alert("Database Error.");
    } finally {
      setDeletingId(null);
    }
  };

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
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <Plus size={20} /> Add New
          </button>
        )}
      </div>

      {isAdding && (
        <div className="space-y-6 mb-12 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-black italic flex items-center gap-2 text-indigo-400"><Sparkles size={20} /> Select Your Habit</h3>
             <button onClick={() => { setIsAdding(false); setShowCustomForm(false); }} className="text-slate-500 hover:text-white"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_SUGGESTIONS.map((preset) => (
              <button key={preset.name} onClick={() => handleAddPreset(preset.name, preset.color)} className="p-5 rounded-[2rem] border border-slate-800 bg-slate-900 hover:border-indigo-500 transition-all text-left h-32 flex flex-col justify-between group">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${preset.color} bg-opacity-20`}><div className={`w-2 h-2 rounded-full ${preset.color}`} /></div>
                <p className="font-bold text-slate-300 group-hover:text-white truncate">{preset.name}</p>
              </button>
            ))}

            {!showCustomForm ? (
              <button onClick={() => setShowCustomForm(true)} className="p-5 rounded-[2rem] border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/50 transition-all flex flex-col items-center justify-center gap-2 h-32 group">
                <Plus size={24} className="text-slate-500 group-hover:text-indigo-400" />
                <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest">Custom</span>
              </button>
            ) : (
              <div className="col-span-2 sm:col-span-1 p-6 rounded-[2.5rem] border-2 border-indigo-500 bg-slate-900 flex flex-col justify-between min-h-[160px] animate-in zoom-in-95 shadow-2xl">
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="grid grid-cols-5 gap-3">
                    {CUSTOM_COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-8 h-8 rounded-full shrink-0 ${c} ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => setShowCustomForm(false)} className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors"><X size={24} /></button>
                    <button onClick={handleCustomSubmit} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"><CheckCircle2 size={24} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-b border-slate-800 pb-8" />
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tracking Now</h4>
        {activeHabits.map((habit) => (
          <div key={habit.id} className={`bg-slate-900 border p-5 rounded-[2rem] flex items-center justify-between group transition-all ${confirmingId === habit.id ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${habit.color} bg-opacity-20 flex items-center justify-center`}><div className={`w-3 h-3 rounded-full ${habit.color}`} /></div>
              <div><p className="font-bold text-lg text-slate-100">{habit.name}</p><p className="text-xs text-slate-500">Active Habit</p></div>
            </div>
            <button onClick={() => setConfirmingId(habit.id)} className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsView;