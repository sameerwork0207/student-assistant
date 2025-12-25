'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState, UserProfile, Domain, TaskEntry, LifeActivity, AnalyticsData } from '@/types';
import { storageService } from '@/lib/storage';
import { analyticsService } from '@/lib/analytics';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  
  // User actions
  setUser: (user: UserProfile) => void;
  
  // Domain actions
  addDomain: (domain: Domain) => void;
  updateDomain: (domain: Domain) => void;
  deleteDomain: (domainId: string) => void;
  
  // Task actions
  addTask: (task: TaskEntry) => void;
  updateTask: (taskId: string, updatedTask: Partial<TaskEntry>) => void;
  deleteTask: (taskId: string) => void;
  
  // Life activity actions
  saveLifeActivity: (activity: LifeActivity) => void;
  
  // Analytics
  recalculateAnalytics: () => void;
  
  // Data persistence
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => storageService.getState());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const initialState = storageService.initializeStorage();
    setState(initialState);
    analyticsService.recalculateAllAnalytics();
    setIsLoading(false);
  }, []);

  const saveState = useCallback((newState: AppState) => {
    setState(newState);
    storageService.saveState(newState);
  }, []);

  const setUser = useCallback(
    (user: UserProfile) => {
      storageService.updateUser(user);
      setState((prev) => ({ ...prev, user, hasCompletedOnboarding: true }));
    },
    []
  );

  const addDomain = useCallback(
    (domain: Domain) => {
      storageService.saveDomain(domain);
      setState((prev) => ({ ...prev, domains: [...prev.domains, domain] }));
    },
    []
  );

  const updateDomain = useCallback(
    (domain: Domain) => {
      storageService.saveDomain(domain);
      setState((prev) => ({
        ...prev,
        domains: prev.domains.map((d) => (d.id === domain.id ? domain : d)),
      }));
    },
    []
  );

  const deleteDomain = useCallback(
    (domainId: string) => {
      storageService.deleteDomain(domainId);
      setState((prev) => ({
        ...prev,
        domains: prev.domains.filter((d) => d.id !== domainId),
        tasks: prev.tasks.filter((t) => t.domainId !== domainId),
      }));
    },
    []
  );

  const addTask = useCallback(
    (task: TaskEntry) => {
      storageService.addTask(task);
      setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    },
    []
  );

  const updateTask = useCallback(
    (taskId: string, updatedTask: Partial<TaskEntry>) => {
      storageService.updateTask(taskId, updatedTask);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t)),
      }));
    },
    []
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      storageService.deleteTask(taskId);
      setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
    },
    []
  );

  const saveLifeActivity = useCallback(
    (activity: LifeActivity) => {
      storageService.saveLifeActivity(activity);
      const dateKey = new Date(activity.date).toISOString().split('T')[0];
      setState((prev) => ({
        ...prev,
        lifeActivities: { ...prev.lifeActivities, [dateKey]: activity },
      }));
    },
    []
  );

  const recalculateAnalytics = useCallback(() => {
    analyticsService.recalculateAllAnalytics();
    setState((prev) => ({
      ...prev,
      analytics: storageService.getState().analytics,
    }));
  }, []);

  const exportData = useCallback(() => {
    return storageService.exportAsJSON();
  }, []);

  const importData = useCallback((jsonData: string) => {
    const success = storageService.importFromJSON(jsonData);
    if (success) {
      setState(storageService.getState());
      analyticsService.recalculateAllAnalytics();
    }
    return success;
  }, []);

  const clearAllData = useCallback(() => {
    storageService.clearAllData();
    setState(storageService.getState());
  }, []);

  const value: AppContextType = {
    state,
    isLoading,
    setUser,
    addDomain,
    updateDomain,
    deleteDomain,
    addTask,
    updateTask,
    deleteTask,
    saveLifeActivity,
    recalculateAnalytics,
    exportData,
    importData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
