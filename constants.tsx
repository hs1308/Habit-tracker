
import React from 'react';
import { 
  Book, Dumbbell, Code, Brain, Target, Coffee, Music, Camera, 
  Heart, Star, Zap, Smile, Moon, Sun, Droplets, Utensils, 
  Bike, Gamepad, Footprints, Flower2 
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  Reading: Book,
  Exercising: Dumbbell,
  Building: Code,
  Learning: Brain,
  Target: Target,
  Focusing: Coffee,
  Music: Music,
  Creative: Camera,
  Health: Heart,
  Star: Star,
  Energy: Zap,
  Happiness: Smile,
  Sleep: Moon,
  Morning: Sun,
  Hydration: Droplets,
  Food: Utensils,
  Cycling: Bike,
  Gaming: Gamepad,
  Running: Footprints,
  Meditating: Flower2,
};

export const COLOR_MAP: Record<string, string> = {
  'bg-indigo-500': '#6366f1',
  'bg-emerald-500': '#10b981',
  'bg-purple-500': '#a855f7',
  'bg-orange-500': '#f97316',
  'bg-blue-500': '#3b82f6',
  'bg-red-500': '#ef4444',
  'bg-pink-500': '#ec4899',
  'bg-amber-500': '#f59e0b',
  'bg-cyan-500': '#06b6d4',
  'bg-rose-500': '#f43f5e',
  'bg-slate-500': '#64748b',
  'bg-lime-500': '#84cc16',
  'bg-fuchsia-500': '#d946ef',
};

export const MAX_TIMER_SECONDS = 6 * 60 * 60; // 6 Hours
