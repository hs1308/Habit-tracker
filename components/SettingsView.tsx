import React, { useState } from 'react';
import { Habit } from '../types';
import { 
  ChevronLeft, Plus, Trash2, Tag, Palette, CheckCircle2, X, Sparkles, 
  Loader2, AlertCircle, Edit2, Book, Dumbbell, Code, Brain, Target, 
  Coffee, Music, Camera, Heart, Star, Zap, Smile, Search,
  Moon, Sun, Droplets, Utensils, Bike, Gamepad, Footprints, Flower2
} from 'lucide-react';

interface SettingsViewProps {
  habits: Habit[];
  onAddHabit: (name: string, color: string, icon: string) => void;
  onUpdateHabit: (id: string, updates: { name?: string; color?: string; icon?: string }) => Promise<void>;
  onDeleteHabit: (id: string) => Promise<void>;
  onBack: () => void;
}

const ICON_OPTIONS = [
  { name: 'Reading', icon: Book },
  { name: 'Exercising', icon: Dumbbell },
  { name: 'Building', icon: Code },
  { name: 'Learning', icon: Brain },
  { name: 'Target', icon: Target },
  { name: 'Focusing', icon: Coffee },
  { name: 'Music', icon: Music },
  { name: 'Creative', icon: Camera },
  { name: 'Health', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Energy', icon: Zap },
  { name: 'Happiness', icon: Smile },
  { name: 'Sleep', icon: Moon },
  { name: 'Morning', icon: Sun },
  { name: 'Hydration', icon: Droplets },
  { name: 'Food', icon: Utensils },
  { name: 'Cycling', icon: Bike },
  { name: 'Gaming', icon: Gamepad },
  { name: 'Running', icon: Footprints },
  { name: 'Meditating', icon: Flower2 },
];

const PRESET_SUGGESTIONS = [
  { name: 'Reading', color: 'bg-blue-500', icon: 'Reading' },
  { name: 'Exercising', color: 'bg-orange-500', icon: 'Exercising' },
  { name: 'Coding', color: 'bg-indigo-500', icon: 'Building' },
  { name: 'Studying', color: 'bg-amber-500', icon: 'Learning' },
  { name: 'Running', color: 'bg-red-500', icon: 'Running' },
  { name: 'Work', color: 'bg-slate-500', icon: 'Target' },
  { name: 'Meditating', color: 'bg-emerald-500', icon: 'Meditating' },
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
  'bg-rose-500',
  'bg-lime-500',
  'bg-fuchsia-500'
];

const SettingsView: React.FC<SettingsViewProps> = ({ habits, onAddHabit, onUpdateHabit, onDeleteHabit, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CUSTOM_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('Target');
  
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeHabits = habits.filter(h => !h.deleted_at);

  const handleAddPreset = (name: string, color: string, icon: string) => {
    if (activeHabits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
      alert("You are already tracking this habit.");
      return;
    }
    onAddHabit(name, color, icon);
    setIsAdding(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (activeHabits.some(h => h.name.toLowerCase() === newName.trim().toLowerCase())) {
        alert("This habit already exists.");
        return;
      }
      onAddHabit(newName.trim(), selectedColor, selectedIcon);
      resetForm();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !newName.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdateHabit(editingHabit.id, {
        name: newName.trim(),
        color: selectedColor,
        icon: selectedIcon
      });
      setEditingHabit(null);
      resetForm();
    } catch (err) {
      alert("Failed to update habit.");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setSelectedColor(CUSTOM_COLORS[0]);
    setSelectedIcon('Target');
    setShowCustomForm(false);
    setIsAdding(false);
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit);
    setNewName(habit.name);
    setSelectedColor(habit.color);
    setSelectedIcon(habit.icon);
    setIsAdding(false);
    setShowCustomForm(false);
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
        {!isAdding && !editingHabit && (
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <Plus size={20} /> Add New
          </button>
        )}
      </div>

      {(isAdding || editingHabit) && (
        <div className="space-y-6 mb-12 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
             <h3 className="text-lg font-black italic flex items-center gap-2 text-indigo-400">
               <Sparkles size={20} /> Select Your Habit
             </h3>
             <button onClick={() => { setIsAdding(false); setShowCustomForm(false); }} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_SUGGESTIONS.map((preset) => {
              const IconComp = ICON_OPTIONS.find(i => i.name === preset.icon)?.icon || Target;
              return (
                <button key={preset.name} onClick={() => handleAddPreset(preset.name, preset.color, preset.icon)} className="p-5 rounded-[2rem] border border-slate-800 bg-slate-900 hover:border-indigo-500 transition-all text-left h-32 flex flex-col justify-between group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${preset.color} bg-opacity-20`}>
                    <IconComp size={18} className="text-white opacity-70" />
                  </div>
                  <p className="font-bold text-slate-300 group-hover:text-white truncate">{preset.name}</p>
                </button>
              );
            })}

            <button onClick={() => setShowCustomForm(true)} className="p-5 rounded-[2rem] border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/50 transition-all flex flex-col items-center justify-center gap-2 h-32 group">
              <Plus size={24} className="text-slate-500 group-hover:text-indigo-400" />
              <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest">Custom</span>
            </button>
          </div>
          <div className="border-b border-slate-800 pb-8" />
        </div>
      )}

      {(showCustomForm || editingHabit) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className={`w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic text-indigo-400 flex items-center gap-2">
                <Sparkles size={24} /> {editingHabit ? 'Edit Habit' : 'Custom Habit'}
              </h3>
              <button onClick={() => { setShowCustomForm(false); setEditingHabit(null); }} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editingHabit ? handleEditSubmit : handleCustomSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Habit Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Morning Yoga"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Choose Color</label>
                <div className="flex flex-wrap gap-3">
                  {CUSTOM_COLORS.map(c => (
                    <button 
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full shrink-0 ${c} transition-transform ${selectedColor === c ? 'ring-2 ring-white ring-offset-4 ring-offset-slate-900 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Choose Icon</label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    const isSelected = selectedIcon === opt.name;
                    return (
                      <button 
                        type="button"
                        key={opt.name}
                        onClick={() => setSelectedIcon(opt.name)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        <IconComp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => { setShowCustomForm(false); setEditingHabit(null); }} 
                  className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={20} className="animate-spin" /> : (editingHabit ? 'Save Changes' : 'Create Habit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tracking Now</h4>
        {activeHabits.map((habit) => {
          const IconComp = ICON_OPTIONS.find(i => i.name === habit.icon)?.icon || Target;
          return (
            <div key={habit.id} className={`bg-slate-900 border p-5 rounded-[2rem] flex items-center justify-between group transition-all ${confirmingId === habit.id ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${habit.color} bg-opacity-20 flex items-center justify-center`}>
                  <IconComp size={24} className="text-white opacity-70" />
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-100">{habit.name}</p>
                  <p className="text-xs text-slate-500">Active Habit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startEditing(habit)}
                  className="p-3 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                  title="Edit Habit"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => setConfirmingId(habit.id)} 
                  className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Delete Habit"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 mx-auto border border-red-500/20">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2 italic">Archive Habit?</h3>
            <p className="text-slate-400 text-center text-sm mb-8">
              This will hide the habit from your dashboard but keep your historical data.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmingId(null)}
                className="flex-1 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-colors"
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button 
                onClick={() => executeDelete(confirmingId)}
                className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                disabled={!!deletingId}
              >
                {deletingId === confirmingId ? <Loader2 className="animate-spin" size={20} /> : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
