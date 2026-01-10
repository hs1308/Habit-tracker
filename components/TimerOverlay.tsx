import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Check, Save, ChevronLeft, Clock } from 'lucide-react';
import { Habit, ActiveTimer } from '../types';
import { formatTimer } from '../utils/dateUtils';
import { MAX_TIMER_SECONDS } from '../constants';

interface TimerOverlayProps {
  habit: Habit;
  activeTimer: ActiveTimer;
  onCancel: () => void;
  onComplete: (duration: number) => void;
}

const TimerOverlay: React.FC<TimerOverlayProps> = ({ habit, activeTimer, onCancel, onComplete }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastCheck, setLastCheck] = useState(Date.now());
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Review state
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);

  useEffect(() => {
    let interval: any;
    if (!isPaused && !isReviewing) {
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastCheck) / 1000);
        setElapsed(prev => {
          const next = prev + delta;
          if (next >= MAX_TIMER_SECONDS) {
            handleCheck(); // Automatically go to review if max reached
            return MAX_TIMER_SECONDS;
          }
          return next;
        });
        setLastCheck(now);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, lastCheck, isReviewing]);

  const handlePauseToggle = () => {
    if (isPaused) {
      setLastCheck(Date.now());
    }
    setIsPaused(!isPaused);
  };

  const handleCheck = () => {
    setIsPaused(true);
    setIsReviewing(true);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    setEditHours(h);
    setEditMinutes(m);
  };

  const handleFinalSave = () => {
    const totalSeconds = (editHours * 3600) + (editMinutes * 60);
    // Ensure we don't save 0 or exceed max
    const finalSeconds = Math.min(Math.max(totalSeconds, 60), MAX_TIMER_SECONDS);
    onComplete(finalSeconds);
  };

  const progress = (elapsed / MAX_TIMER_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {!isReviewing ? (
          <div className="p-8 text-center">
            <div className="flex justify-between items-start mb-4">
              <div className="text-left">
                <p className="text-indigo-400 font-bold tracking-widest uppercase text-[10px]">Active Focus</p>
                <h2 className="text-2xl font-black italic">{habit.name}</h2>
              </div>
              <button 
                onClick={onCancel}
                className="p-3 bg-slate-800 text-slate-500 hover:text-red-400 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress Circle Container */}
            <div className="relative w-56 h-56 mx-auto my-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="104"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="112"
                  cy="112"
                  r="104"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={653}
                  strokeDashoffset={653 - (653 * progress) / 100}
                  strokeLinecap="round"
                  className="text-indigo-500 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-5xl font-mono font-black text-white">{formatTimer(elapsed)}</span>
                <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-slate-800 rounded-full">
                  <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    {isPaused ? 'Paused' : 'Recording'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center gap-6 mt-4">
              <button 
                onClick={handlePauseToggle}
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all transform active:scale-90 shadow-xl ${
                  isPaused 
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                    : 'bg-indigo-600 text-white shadow-indigo-600/20'
                }`}
              >
                {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
              </button>
              
              <button 
                onClick={handleCheck}
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600/20 transition-all border border-slate-700"
              >
                <Check size={28} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setIsReviewing(false)} 
                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-black italic">Review Session</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consistency Log</p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-[2rem] p-8 mb-8 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                <Clock size={14} className="text-indigo-400" /> Adjust Duration
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col gap-2">
                  <input 
                    type="number"
                    min="0"
                    max="6"
                    value={editHours}
                    onChange={(e) => setEditHours(Math.min(6, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-2xl py-6 text-center text-4xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hours</span>
                </div>
                
                <span className="text-3xl font-black text-slate-700 mb-6">:</span>
                
                <div className="flex flex-col gap-2">
                  <input 
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-2xl py-6 text-center text-4xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Minutes</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-800/50">
                <div className="flex justify-between items-center text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${habit.color} bg-opacity-20 flex items-center justify-center`}>
                      <div className={`w-2 h-2 rounded-full ${habit.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{habit.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Focus Habit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-indigo-400">
                      {editHours}h {editMinutes}m
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Final Total</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleFinalSave}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Save size={24} /> Save Activity
            </button>
          </div>
        )}
        
        <div className="bg-slate-800/30 p-4 text-center border-t border-slate-800/50">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] italic">
            &quot;Consistency over intensity&quot;
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay;