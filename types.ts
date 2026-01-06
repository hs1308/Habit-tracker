
export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  timezone: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  habit_name: string;
  user_name: string;
  log_created_date: string;
  icon: string;
  color: string;
  created_at: string;
  deleted_at: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  habit_name: string;       // New denormalized field
  user_name: string;        // New denormalized field
  log_created_date: string;  // New denormalized field
  start_time: string;
  end_time: string;
  duration_seconds: number;
  attributed_date: string;
}

export interface ActiveTimer {
  habitId: string;
  startTime: number;
}
