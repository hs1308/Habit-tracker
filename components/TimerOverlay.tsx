
import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Check } from 'lucide-react';
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

  useEffect(() => {
    let interval: any;
    if (!isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastCheck) / 1000);
        setElapsed(prev => {
          const next = prev + delta;
          if (next >= MAX_TIMER_SECONDS) {
            onComplete(MAX_TIMER_SECONDS);
            return MAX_TIMER_SECONDS;
          }
          return next;
        });
        setLastCheck(now);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, lastCheck, onComplete]);

  const handlePauseToggle = () => {
    if (isPaused) {
      setLastCheck(Date.now());
    }
    setIsPaused(!isPaused);
  };

  const progress = (elapsed / MAX_TIMER_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 text-center">
          <p className="text-indigo-400 font-semibold mb-2 tracking-widest uppercase text-xs">Tracking Consistency</p>
          <h2 className="text-2xl font-bold mb-8">{habit.name}</h2>
          
          {/* Progress Circle Container */}
          <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={553}
                strokeDashoffset={553 - (553 * progress) / 100}
                className="text-indigo-500 transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-mono font-bold">{formatTimer(elapsed)}</span>
              <span className="text-slate-500 text-xs mt-1">Limit 6:00:00</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-6">
            <button 
              onClick={onCancel}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <X size={24} />
            </button>
            <button 
              onClick={handlePauseToggle}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${isPaused ? 'bg-emerald-500' : 'bg-indigo-500'} text-white shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95`}
            >
              {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
            </button>
            <button 
              onClick={() => onComplete(elapsed)}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all"
            >
              <Check size={24} />
            </button>
          </div>
        </div>
        
        <div className="bg-slate-800/50 p-4 text-center">
          <p className="text-slate-400 text-xs italic">&quot;Do some action everyday, however small&quot;</p>
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay;
