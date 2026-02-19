
import React, { useState, useEffect } from 'react';
import { ChevronLeft, StickyNote, Trash2, CheckCircle2, Cloud } from 'lucide-react';

interface NotepadViewProps {
  content: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onChange: (content: string) => void;
  onBack: () => void;
}

const NotepadView: React.FC<NotepadViewProps> = ({ content, isSaving, lastSaved, onChange, onBack }) => {
  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your entire notepad? This cannot be undone.")) {
      onChange('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Scratchpad <StickyNote size={20} className="text-indigo-400" />
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
              {isSaving ? (
                <span className="text-indigo-400 flex items-center gap-1 animate-pulse">
                  <Cloud size={10} /> Syncing to cloud...
                </span>
              ) : lastSaved ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span>Persistent storage active</span>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={handleClear}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          title="Clear everything"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 relative mb-4">
        <textarea
          autoFocus
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing your thoughts, paste links, or draft ideas here... everything is auto-saved."
          className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 text-base text-slate-200 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none placeholder:text-slate-600 placeholder:italic"
        />
        
        <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-700 uppercase tracking-widest pointer-events-none">
          {content.length} characters
        </div>
      </div>

      <p className="text-[10px] text-center text-slate-600 uppercase tracking-[0.3em] font-bold italic py-4">
        A clear mind is a focused mind
      </p>
    </div>
  );
};

export default NotepadView;