/**
 * Storage Service - LocalStorage-based persistence
 * Offline-first, privacy-preserving data layer
 */

import { AppState, UserProfile, Domain, TaskEntry, LifeActivity, AnalyticsData } from '@/types';

const STORAGE_KEY = 'student-assistant-app-state';
const VERSION = 1;

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
   * Initialize storage with default app state
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
      const data: StorageData = JSON.parse(stored);
      if (data.version !== VERSION) {
        console.warn('Storage version mismatch, migrating...');
        return this.migrateStorage(data);
      }
      return data.state;
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
    // Also remove tasks for this domain
    state.tasks = state.tasks.filter((t) => t.domainId !== domainId);
    this.saveState(state);
  }

  /**
   * Add task entry
   */
  addTask(task: TaskEntry): void {
    const state = this.getState();
    state.tasks.push(task);
    this.saveState(state);
  }

  /**
   * Update task entry
   */
  updateTask(taskId: string, updatedTask: Partial<TaskEntry>): void {
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
   * Get tasks for a specific domain on a date
   */
  getTasksByDomainAndDate(domainId: string, dateNumber: number): TaskEntry[] {
    const state = this.getState();
    return state.tasks.filter((t) => {
      if (t.domainId !== domainId) return false;
      const taskDate = new Date(t.data.date);
      const compareDate = new Date(dateNumber);
      return (
        taskDate.getFullYear() === compareDate.getFullYear() &&
        taskDate.getMonth() === compareDate.getMonth() &&
        taskDate.getDate() === compareDate.getDate()
      );
    });
  }

  /**
   * Get all tasks for a domain
   */
  getTasksByDomain(domainId: string): TaskEntry[] {
    const state = this.getState();
    return state.tasks.filter((t) => t.domainId === domainId);
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
   * Export data as JSON
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
      if (!parsed.user || !parsed.domains) {
        throw new Error('Invalid data format');
      }
      this.saveState(parsed);
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
   * Get default empty state
   */
  private getDefaultState(): AppState {
    return {
      user: null,
      domains: [],
      tasks: [],
      lifeActivities: {},
      analytics: {
        dailyStats: {},
        streaks: {},
        trends: [],
        averageHoursPerDay: 0,
      },
      hasCompletedOnboarding: false,
    };
  }

  /**
   * Migration handler for storage version changes
   */
  private migrateStorage(oldData: StorageData): AppState {
    // Implement migration logic here if needed
    return oldData.state;
  }
}

export const storageService = StorageService.getInstance();
