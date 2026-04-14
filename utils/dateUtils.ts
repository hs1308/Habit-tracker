
export const formatDuration = (totalSeconds: number): string => {
  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  
  const sign = isNegative ? '-' : '';
  if (h > 0) return `${sign}${h}h ${m}m`;
  return `${sign}${m}m`;
};

export const formatTimer = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getAttributedDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  // Monday is 1, Sunday is 0. 
  // If Sunday (0), we want to go back 6 days.
  // If Monday (1), we want to go back 0 days.
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getPeriodDates = (refDate: Date, mode: 'week' | 'month'): string[] => {
  const dates: string[] = [];
  if (mode === 'week') {
    const start = getStartOfWeek(refDate);
    for (let i = 0; i < 7; i++) {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      dates.push(getAttributedDate(next));
    }
  } else {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      dates.push(getAttributedDate(date));
    }
  }
  return dates;
};

export const getCalendarGrid = (refDate: Date) => {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  
  const grid = [];
  // If first day is Sunday (0), we need 6 empty slots.
  // If first day is Monday (1), we need 0 empty slots.
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  for (let i = 0; i < startOffset; i++) {
    grid.push(null);
  }

  for (let d = 1; d <= lastDayOfMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({
      day: d,
      date: getAttributedDate(date)
    });
  }

  return grid;
};

export const getPeriodLabel = (refDate: Date, mode: 'week' | 'month'): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (mode === 'week') {
    const start = getStartOfWeek(refDate);
    const end = getEndOfWeek(refDate);
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  } else {
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${fullMonths[refDate.getMonth()]} ${refDate.getFullYear()}`;
  }
};

export const getDayName = (dateStr: string) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [y, m, d] = dateStr.split('-').map(Number);
  return days[new Date(y, m - 1, d).getDay()];
};
