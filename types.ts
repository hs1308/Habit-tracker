
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  deleted_at: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  attributed_date: string; // The "Start Day" logic
}

export interface ActiveTimer {
  habitId: string;
  startTime: number;
}
