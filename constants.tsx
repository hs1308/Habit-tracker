
import React from 'react';
import { Book, Dumbbell, Code, Brain, Target, Coffee, Music, Camera } from 'lucide-react';

export const HABIT_ICONS = [
  { name: 'Reading', icon: <Book size={24} /> },
  { name: 'Exercising', icon: <Dumbbell size={24} /> },
  { name: 'Building', icon: <Code size={24} /> },
  { name: 'Learning', icon: <Brain size={24} /> },
  { name: 'Applying', icon: <Target size={24} /> },
  { name: 'Focusing', icon: <Coffee size={24} /> },
  { name: 'Creative', icon: <Camera size={24} /> },
  { name: 'Music', icon: <Music size={24} /> },
];

export const MAX_TIMER_SECONDS = 6 * 60 * 60; // 6 Hours
