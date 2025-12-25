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
  preferencesDarkMode?: boolean;
}

// Productivity Domains
export enum DefaultDomain {
  ACADEMIC_STUDIES = 'academic_studies',
  PERSONAL_STUDIES = 'personal_studies',
  SPORTS_HOBBIES = 'sports_hobbies_art',
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

// Domain-Specific Task Data
export interface AcademicTask {
  type: 'academic';
  date: number;
  hoursSpent: number;
  subject: string;
  unitStudied: string;
  conceptsCleared: 'Yes' | 'Partial' | 'No';
  revisionDone: boolean;
  notes?: string;
}

export interface SportsArtTask {
  type: 'sports_art';
  date: number;
  hoursSpent: number;
  skillsPracticed: string[];
  skillsLearned: string[];
  performancesAttended?: number;
  notes?: string;
}

export interface SocialSkillsTask {
  type: 'social';
  date: number;
  peopleInteracted: number;
  newPeopleMet: number;
  lifetimeStrangersTalked?: number;
  notes?: string;
}

export interface PersonalStudiesTask {
  type: 'personal';
  date: number;
  subDomain: string;
  task: string;
  hoursSpent: number;
  completed: boolean;
  notes?: string;
}

export type DomainTask = AcademicTask | SportsArtTask | SocialSkillsTask | PersonalStudiesTask;

// Task Entry
export interface TaskEntry {
  id: string;
  domainId: string;
  data: DomainTask;
  createdAt: number;
  updatedAt: number;
}

// Life Activity Tracking
export interface LifeActivity {
  date: number;
  sleep: {
    hours: number;
    quality?: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  };
  eating: number; // hours
  travel: number; // hours
  idleScrolling: number; // hours
  other?: number; // hours
}

// Analytics & Statistics
export interface DailyStats {
  date: number;
  totalHours: number;
  domainsHours: Record<string, number>; // domainId -> hours
  tasksCompleted: number;
  productivityScore: number;
  avgProductivityPerDomain: Record<string, number>;
}

export interface Streak {
  domainId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: number;
}

export interface ProductivityTrend {
  week: number;
  year: number;
  data: {
    day: string;
    hoursTracked: number;
    tasksCompleted: number;
    productivityScore: number;
  }[];
}

export interface AnalyticsData {
  dailyStats: Record<string, DailyStats>; // date -> stats
  streaks: Record<string, Streak>; // domainId -> streak
  trends: ProductivityTrend[];
  mostProductiveHour?: number;
  mostProductiveDay?: string;
  averageHoursPerDay: number;
}

// AI Insights
export interface DailySummary {
  date: number;
  totalHours: number;
  highlightedDomains: string[]; // top 3 domains by hours
  patterns: string[]; // behavioral insights
  suggestions: string[]; // improvement suggestions
  burnoutRisk: 'Low' | 'Medium' | 'High';
  motivationalMessage: string;
}

export interface AIInsight {
  type: 'summary' | 'pattern' | 'burnout' | 'improvement';
  message: string;
  actionableItem?: string;
  generatedAt: number;
}

// App State
export interface AppState {
  user: UserProfile | null;
  domains: Domain[];
  tasks: TaskEntry[];
  lifeActivities: Record<string, LifeActivity>; // date -> activity
  analytics: AnalyticsData;
  hasCompletedOnboarding: boolean;
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
