/**
 * Storage Service - LocalStorage-based persistence
 * Offline-first, privacy-preserving data layer
 * Version 2: Centralized ActivityLog single source of truth, Task/Log separation, timer persistence.
 */

import { AppState, UserProfile, Domain, Task, ActivityLog, TimerSession, LifeActivity, AnalyticsData } from '@/types';

const STORAGE_KEY = 'student-assistant-app-state';
const VERSION = 2;

interface StorageData {
  version: number;
  state: AppState;
  lastBackup?: number;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage with default app state, performing migrations if needed
   */
  initializeStorage(): AppState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultState = this.getDefaultState();
      this.saveState(defaultState);
      return defaultState;
    }

    try {
      const data = JSON.parse(stored);
      
      // Migration from v1 or unversioned
      if (!data.version || data.version < VERSION) {
        console.warn(`Storage version mismatch (${data.version || 1} -> ${VERSION}), migrating...`);
        const migratedState = this.migrateStorage(data);
        this.saveState(migratedState);
        return migratedState;
      }
      
      // Ensure key arrays/objects exist in state
      const state = data.state;
      if (!state.activityLogs) state.activityLogs = [];
      if (!state.tasks) state.tasks = [];
      if (!state.timerSessions) state.timerSessions = {};
      if (!state.lifeActivities) state.lifeActivities = {};
      
      return state;
    } catch (error) {
      console.error('Failed to parse storage:', error);
      return this.getDefaultState();
    }
  }

  /**
   * Save complete app state
   */
  saveState(state: AppState): void {
    if (typeof window === 'undefined') return;

    try {
      const data: StorageData = {
        version: VERSION,
        state,
        lastBackup: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Get the entire app state
   */
  getState(): AppState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return this.getDefaultState();
    }

    try {
      const data: StorageData = JSON.parse(stored);
      return data.state;
    } catch {
      return this.getDefaultState();
    }
  }

  /**
   * Update user profile
   */
  updateUser(user: UserProfile): void {
    const state = this.getState();
    state.user = user;
    state.hasCompletedOnboarding = true;
    this.saveState(state);
  }

  /**
   * Add or update domain
   */
  saveDomain(domain: Domain): void {
    const state = this.getState();
    const existingIndex = state.domains.findIndex((d) => d.id === domain.id);
    if (existingIndex >= 0) {
      state.domains[existingIndex] = domain;
    } else {
      state.domains.push(domain);
    }
    this.saveState(state);
  }

  /**
   * Delete domain
   */
  deleteDomain(domainId: string): void {
    const state = this.getState();
    state.domains = state.domains.filter((d) => d.id !== domainId);
    state.tasks = state.tasks.filter((t) => t.domainId !== domainId);
    state.activityLogs = state.activityLogs.filter((al) => al.domainId !== domainId);
    if (state.timerSessions[domainId]) {
      delete state.timerSessions[domainId];
    }
    this.saveState(state);
  }

  /**
   * Add task entry
   */
  addTask(task: Task): void {
    const state = this.getState();
    state.tasks.push(task);
    this.saveState(state);
  }

  /**
   * Update task entry
   */
  updateTask(taskId: string, updatedTask: Partial<Task>): void {
    const state = this.getState();
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex >= 0) {
      state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updatedTask };
      this.saveState(state);
    }
  }

  /**
   * Delete task
   */
  deleteTask(taskId: string): void {
    const state = this.getState();
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    this.saveState(state);
  }

  /**
   * Add Activity Log
   */
  addActivityLog(log: ActivityLog): void {
    const state = this.getState();
    state.activityLogs.push(log);
    this.saveState(state);
  }

  /**
   * Update Activity Log
   */
  updateActivityLog(logId: string, updatedLog: Partial<ActivityLog>): void {
    const state = this.getState();
    const index = state.activityLogs.findIndex((al) => al.id === logId);
    if (index >= 0) {
      state.activityLogs[index] = { ...state.activityLogs[index], ...updatedLog };
      this.saveState(state);
    }
  }

  /**
   * Delete Activity Log
   */
  deleteActivityLog(logId: string): void {
    const state = this.getState();
    state.activityLogs = state.activityLogs.filter((al) => al.id !== logId);
    this.saveState(state);
  }

  /**
   * Save running/paused Timer Session for a domain
   */
  saveTimerSession(domainId: string, session: TimerSession): void {
    const state = this.getState();
    state.timerSessions[domainId] = session;
    this.saveState(state);
  }

  /**
   * Delete Timer Session
   */
  deleteTimerSession(domainId: string): void {
    const state = this.getState();
    if (state.timerSessions[domainId]) {
      delete state.timerSessions[domainId];
      this.saveState(state);
    }
  }

  /**
   * Save life activity
   */
  saveLifeActivity(activity: LifeActivity): void {
    const state = this.getState();
    const dateKey = new Date(activity.date).toISOString().split('T')[0];
    state.lifeActivities[dateKey] = activity;
    this.saveState(state);
  }

  /**
   * Get life activity for a date
   */
  getLifeActivity(dateNumber: number): LifeActivity | null {
    const state = this.getState();
    const dateKey = new Date(dateNumber).toISOString().split('T')[0];
    return state.lifeActivities[dateKey] || null;
  }

  /**
   * Update analytics
   */
  updateAnalytics(analytics: AnalyticsData): void {
    const state = this.getState();
    state.analytics = analytics;
    this.saveState(state);
  }

  /**
   * Export data as JSON string
   */
  exportAsJSON(): string {
    const state = this.getState();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import data from JSON
   */
  importFromJSON(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      // Basic checks
      const stateToImport = parsed.state || parsed;
      if (!stateToImport.user || !stateToImport.domains) {
        throw new Error('Invalid data format');
      }
      
      // Force Version 2 properties
      if (!stateToImport.activityLogs) stateToImport.activityLogs = [];
      if (!stateToImport.tasks) stateToImport.tasks = [];
      if (!stateToImport.timerSessions) stateToImport.timerSessions = {};
      if (!stateToImport.lifeActivities) stateToImport.lifeActivities = {};
      stateToImport.schemaVersion = VERSION;

      this.saveState(stateToImport);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get default empty state (Version 2)
   */
  getDefaultState(): AppState {
    return {
      user: null,
      domains: [],
      tasks: [],
      activityLogs: [],
      timerSessions: {},
      lifeActivities: {},
      analytics: {
        dailyStats: {},
        streaks: {},
        trends: [],
        averageHoursPerDay: 0,
      },
      hasCompletedOnboarding: false,
      schemaVersion: VERSION,
    };
  }

  /**
   * Safe migration from older storage versions to Version 2
   */
  private migrateStorage(oldData: any): AppState {
    const oldState = oldData?.state || oldData;
    const defaultState = this.getDefaultState();
    
    const migratedState: AppState = {
      ...defaultState,
      user: oldState.user || null,
      hasCompletedOnboarding: oldState.hasCompletedOnboarding || false,
    };

    // 1. Domains Migration (Split sports_hobbies_art into sports, hobbies, art)
    let hasCombinedSportsHobbiesArt = false;
    if (Array.isArray(oldState.domains)) {
      migratedState.domains = oldState.domains.map((d: any) => {
        if (d.id === 'sports_hobbies_art') {
          hasCombinedSportsHobbiesArt = true;
          return {
            id: 'hobbies',
            name: 'Hobbies',
            description: d.description || 'Track your hobbies',
            isCustom: false,
            color: '#F59E0B',
            icon: '🎮',
            createdAt: d.createdAt || Date.now(),
          };
        }
        return d;
      });
      
      if (hasCombinedSportsHobbiesArt) {
        // Inject sports and art
        migratedState.domains.push({
          id: 'sports',
          name: 'Sports',
          description: 'Track sports and skills practice',
          isCustom: false,
          color: '#10B981',
          icon: '⚽',
          createdAt: Date.now(),
        }, {
          id: 'art',
          name: 'Art',
          description: 'Track creative and artistic practice',
          isCustom: false,
          color: '#8B5CF6',
          icon: '🎨',
          createdAt: Date.now(),
        });
      }
    }

    // 2. Migrate Tasks (convert legacy TaskEntry to ActivityLogs and Tasks)
    const legacyTasks = oldState.tasks || [];
    const migratedActivityLogs: ActivityLog[] = [];
    const migratedTasks: Task[] = [];

    if (Array.isArray(legacyTasks)) {
      legacyTasks.forEach((legacy: any) => {
        // Safe mapping
        let domId = legacy.domainId;
        let isMigratedLegacy = false;
        if (domId === 'sports_hobbies_art') {
          domId = 'hobbies'; // default to hobbies per migration instruction
          isMigratedLegacy = true;
        }

        const taskData = legacy.data || {};
        const hours = taskData.hoursSpent || 0;
        const noteText = taskData.notes || '';
        const taskDate = taskData.date || legacy.createdAt || Date.now();
        const midnight = new Date(taskDate).setHours(0, 0, 0, 0);

        // Normalize topic & subdomain
        let topicName = 'Study/Practice Session';
        let subName = '';
        const detailsObj: Record<string, any> = {};

        if (taskData.type === 'academic') {
          topicName = taskData.unitStudied || 'Academic Log';
          subName = taskData.subject || '';
          detailsObj.conceptsCleared = taskData.conceptsCleared || 'Yes';
          detailsObj.revisionDone = !!taskData.revisionDone;
        } else if (taskData.type === 'personal') {
          topicName = taskData.task || 'Personal Log';
          subName = taskData.subDomain || '';
          
          // Migrate incomplete personal tasks as pending tasks
          if (taskData.completed === false) {
            migratedTasks.push({
              id: legacy.id,
              title: topicName,
              domainId: domId,
              subdomain: subName || undefined,
              status: 'pending',
              createdAt: legacy.createdAt || Date.now(),
            });
          }
        } else if (taskData.type === 'sports_art') {
          topicName = (taskData.skillsPracticed && taskData.skillsPracticed[0]) || 'Practice Session';
          subName = 'Practice';
          detailsObj.skillsPracticed = taskData.skillsPracticed || [];
          detailsObj.skillsLearned = taskData.skillsLearned || [];
          detailsObj.performancesAttended = taskData.performancesAttended || 0;
        }

        // Add to activity logs
        migratedActivityLogs.push({
          id: legacy.id,
          domainId: domId,
          topic: topicName,
          subdomain: subName || undefined,
          hoursSpent: hours,
          notes: noteText || undefined,
          source: 'manual',
          date: midnight,
          createdAt: legacy.createdAt || Date.now(),
          updatedAt: legacy.updatedAt || Date.now(),
          migratedLegacy: isMigratedLegacy || undefined,
          details: Object.keys(detailsObj).length > 0 ? detailsObj : undefined,
        });
      });
    }

    migratedState.activityLogs = migratedActivityLogs;
    migratedState.tasks = migratedTasks;

    // 3. Migrate Life Activities
    const oldLife = oldState.lifeActivities || {};
    const migratedLife: Record<string, LifeActivity> = {};

    Object.keys(oldLife).forEach((key) => {
      const act = oldLife[key];
      if (act) {
        // convert quality + structures
        const sleepHrs = typeof act.sleep === 'object' ? (act.sleep.hours || 0) : (act.sleep || 0);
        migratedLife[key] = {
          date: act.date || new Date(key).getTime(),
          sleep: sleepHrs,
          travel: act.travel || 0,
          meals: act.eating || 0,
          scrollIdle: act.idleScrolling || 0,
          socialize: 0, // default
          custom: act.other ? { 'Other': act.other } : {},
        };
      }
    });

    migratedState.lifeActivities = migratedLife;
    migratedState.schemaVersion = VERSION;

    return migratedState;
  }
}

export const storageService = StorageService.getInstance();
