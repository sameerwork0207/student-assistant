/**
 * Core Type Definitions for Student Assistant App
 * Domain-driven design with comprehensive data models
 */

// Education Level
export enum EducationLevel {
  SCHOOL = 'school',
  JUNIOR_COLLEGE = 'junior_college',
  DEGREE_COLLEGE = 'degree_college',
}

// Education Details based on Level
export interface SchoolDetails {
  level: EducationLevel.SCHOOL;
  classGrade: string; // e.g., "10", "11", "12"
}

export interface JuniorCollegeDetails {
  level: EducationLevel.JUNIOR_COLLEGE;
  stream: 'Science' | 'Commerce' | 'Arts';
}

export interface DegreeCollegeDetails {
  level: EducationLevel.DEGREE_COLLEGE;
  degree: string; // e.g., "Engineering", "BCA", "Commerce"
  specialization?: string; // e.g., "Computer Science", "Electronics"
  year: 1 | 2 | 3 | 4;
}

export type EducationDetails = SchoolDetails | JuniorCollegeDetails | DegreeCollegeDetails;

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  educationDetails: EducationDetails;
  createdAt: number;
  lastUpdated: number;
}

// Productivity Domains (Sectors)
export enum DefaultDomain {
  ACADEMIC_STUDIES = 'academic_studies',
  PERSONAL_STUDIES = 'personal_studies',
  SPORTS = 'sports',
  HOBBIES = 'hobbies',
  ART = 'art',
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  isCustom: boolean;
  color: string;
  icon?: string;
  createdAt: number;
}

// Tasks (Planned Intention)
export interface Task {
  id: string;
  title: string;
  domainId: string;
  subdomain?: string; // normalized
  status: 'pending' | 'completed';
  createdAt: number;
  completedAt?: number;
  linkedActivityLogId?: string; // Links task completion directly to an ActivityLog entry
}

// ActivityLogs (Actual Execution - Single Source of Truth)
export interface ActivityLog {
  id: string;
  domainId: string;
  topic: string; // normalized
  subdomain?: string; // normalized (subject, sport name, hobby name, art type, etc.)
  hoursSpent: number;
  notes?: string;
  source: 'manual' | 'timer' | 'task';
  date: number; // midnight timestamp
  createdAt: number;
  updatedAt: number;
  linkedTaskId?: string;
  migratedLegacy?: boolean;
  details?: Record<string, any>; // sector specific values
}

// TimerSessions (Persistent Running Timers)
export interface TimerSession {
  startedAt: number; // timestamp
  pausedAt: number | null; // timestamp when paused, null if running
  totalPausedTime: number; // milliseconds spent paused
  isActive: boolean;
  linkedTaskId: string | null;
  sectorId: string;
  topic: string;
  subdomain?: string;
}

// LifeActivities (Sleep, Commute, Meals, etc.)
export interface LifeActivity {
  date: number; // midnight timestamp
  sleep: number; // hours
  travel: number; // hours
  meals: number; // hours
  scrollIdle: number; // hours
  socialize: number; // hours
  custom: Record<string, number>; // custom field -> hours
}

// Analytics & Statistics
export interface DailyStats {
  date: number;
  totalHours: number;
  domainsHours: Record<string, number>; // domainId -> hours
  tasksCompleted: number;
  productivityScore: number;
}

export interface Streak {
  domainId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: number;
}

export interface ProductivityTrend {
  day: string; // e.g. "Mon"
  hoursTracked: number;
  dateKey: string; // "YYYY-MM-DD"
}

export interface AnalyticsData {
  dailyStats: Record<string, DailyStats>; // dateKey -> stats
  streaks: Record<string, Streak>; // domainId -> streak
  trends: ProductivityTrend[];
  averageHoursPerDay: number;
}

// App State
export interface AppState {
  user: UserProfile | null;
  domains: Domain[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  timerSessions: Record<string, TimerSession>; // domainId -> TimerSession
  lifeActivities: Record<string, LifeActivity>; // dateKey -> LifeActivity
  analytics: AnalyticsData;
  hasCompletedOnboarding: boolean;
  schemaVersion: number;
  lastSyncedAt?: number;
}

// Notification Settings
export interface NotificationSettings {
  enabled: boolean;
  dailySummary: boolean;
  weeklyReview: boolean;
  reminders: boolean;
  reminderTime?: string; // HH:MM format
}

// Export Settings
export interface ExportOptions {
  format: 'pdf' | 'csv';
  dateRange: {
    start: number;
    end: number;
  };
  includeDomains: string[];
  includeAnalytics: boolean;
}
