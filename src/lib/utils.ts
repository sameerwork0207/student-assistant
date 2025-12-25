/**
 * Utility Functions
 */

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(dateNumber: number): string {
  const date = new Date(dateNumber);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to readable format
 */
export function formatDateReadable(dateNumber: number): string {
  const date = new Date(dateNumber);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get date range for week
 */
export function getWeekRange(dateNumber?: number): {
  start: number;
  end: number;
  weekNumber: number;
} {
  const date = dateNumber ? new Date(dateNumber) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day;

  const monday = new Date(date.setDate(diff + (day === 0 ? -6 : 1)));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekNumber = Math.ceil((date.getDate() - date.getDay()) / 7);

  return {
    start: monday.getTime(),
    end: sunday.getTime(),
    weekNumber,
  };
}

/**
 * Get date range for month
 */
export function getMonthRange(dateNumber?: number): {
  start: number;
  end: number;
  month: string;
} {
  const date = dateNumber ? new Date(dateNumber) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);

  const monthStr = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return {
    start: start.getTime(),
    end: end.getTime(),
    month: monthStr,
  };
}

/**
 * Get date range for year
 */
export function getYearRange(year?: number): {
  start: number;
  end: number;
  year: number;
} {
  const y = year || new Date().getFullYear();
  const start = new Date(y, 0, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(y, 11, 31);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.getTime(),
    end: end.getTime(),
    year: y,
  };
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: number, date2: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get today at midnight
 */
export function getTodayMidnight(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

/**
 * Get the hours decimal from hours and minutes
 */
export function timeToHours(hours: number, minutes: number = 0): number {
  return hours + minutes / 60;
}

/**
 * Convert decimal hours to hours and minutes
 */
export function hoursToTime(totalHours: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return { hours, minutes };
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  const { hours: h, minutes: m } = hoursToTime(hours);
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

/**
 * Color palette for domains
 */
export const DOMAIN_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
];

/**
 * Get random color from palette
 */
export function getRandomColor(): string {
  return DOMAIN_COLORS[Math.floor(Math.random() * DOMAIN_COLORS.length)];
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Get day of week name
 */
export function getDayName(dateNumber: number): string {
  const date = new Date(dateNumber);
  return date.toLocaleString('en-US', { weekday: 'short' });
}

/**
 * Get abbreviated month name
 */
export function getMonthName(dateNumber: number): string {
  const date = new Date(dateNumber);
  return date.toLocaleString('en-US', { month: 'short' });
}
