'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppState, UserProfile, Domain, Task, ActivityLog, TimerSession, LifeActivity } from '@/types';
import { storageService } from '@/lib/storage';
import { analyticsService } from '@/lib/analytics';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  
  // Undo / Toast actions
  undoMessage: string | null;
  triggerUndo: () => void;
  clearUndo: () => void;

  // User actions
  setUser: (user: UserProfile) => void;
  
  // Domain actions
  addDomain: (domain: Domain) => void;
  renameDomain: (domainId: string, newName: string) => void;
  archiveDomain: (domainId: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'domainNameSnapshot'>) => void;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => void;
  toggleTaskCompletion: (taskId: string, logHours?: number, logNotes?: string) => void;
  deleteTask: (taskId: string) => void;
  
  // Activity Log actions
  addActivityLog: (log: Omit<ActivityLog, 'domainNameSnapshot'>) => void;
  updateActivityLog: (logId: string, updatedLog: Partial<ActivityLog>) => void;
  deleteActivityLog: (logId: string) => void;

  // Timer actions
  startTimer: (domainId: string, topic: string, subdomain?: string, linkedTaskId?: string) => void;
  pauseTimer: (domainId: string) => void;
  resumeTimer: (domainId: string) => void;
  stopTimer: (domainId: string) => ActivityLog | null;
  cancelTimer: (domainId: string) => void;
  
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
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      return storageService.initializeStorage();
    }
    return storageService.getDefaultState();
  });
  const [isLoading, setIsLoading] = useState(true);

  // Undo support
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const registerUndo = useCallback((action: () => void, message: string) => {
    setUndoAction(() => action);
    setUndoMessage(message);
    const timer = setTimeout(() => {
      setUndoAction(null);
      setUndoMessage(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const triggerUndo = useCallback(() => {
    if (undoAction) {
      undoAction();
      setUndoAction(null);
      setUndoMessage(null);
    }
  }, [undoAction]);

  const clearUndo = useCallback(() => {
    setUndoAction(null);
    setUndoMessage(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    analyticsService.recalculateAllAnalytics();
    Promise.resolve().then(() => {
      setIsLoading(false);
    });

    // New Day Detection
    const checkNewDay = () => {
      const lastActiveStr = localStorage.getItem('student-assistant-last-active-date');
      const todayStr = new Date().toISOString().split('T')[0];

      if (lastActiveStr && lastActiveStr !== todayStr) {
        console.log('New day detected. Recalculating stats.');
        analyticsService.recalculateAllAnalytics();
      }
      localStorage.setItem('student-assistant-last-active-date', todayStr);
    };

    checkNewDay();
    window.addEventListener('focus', checkNewDay);
    return () => window.removeEventListener('focus', checkNewDay);
  }, []);


  const setUser = useCallback(
    (user: UserProfile) => {
      storageService.updateUser(user);
      setState((prev) => ({ ...prev, user, hasCompletedOnboarding: true }));
    },
    []
  );

  // --- Domain / Sector Operations ---
  const addDomain = useCallback(
    (domain: Domain) => {
      storageService.saveDomain(domain);
      setState((prev) => ({ ...prev, domains: [...prev.domains, domain] }));
    },
    []
  );

  const renameDomain = useCallback(
    (domainId: string, newName: string) => {
      setState((prev) => {
        const domain = prev.domains.find((d) => d.id === domainId);
        if (!domain || domain.isArchived) return prev;

        const updatedDomain = { ...domain, name: newName.trim() };
        storageService.saveDomain(updatedDomain);

        return {
          ...prev,
          domains: prev.domains.map((d) => (d.id === domainId ? updatedDomain : d)),
        };
      });
    },
    []
  );

  const archiveDomain = useCallback(
    (domainId: string) => {
      storageService.archiveDomain(domainId);
      setState((prev) => {
        const newTimers = { ...prev.timerSessions };
        delete newTimers[domainId];
        return {
          ...prev,
          domains: prev.domains.map((d) => (d.id === domainId ? { ...d, isArchived: true } : d)),
          timerSessions: newTimers,
        };
      });
      setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
    },
    []
  );

  // --- Tasks Operations (Separate planned intention) ---
  const addTask = useCallback(
    (taskFields: Omit<Task, 'domainNameSnapshot'>) => {
      setState((prev) => {
        const dom = prev.domains.find((d) => d.id === taskFields.domainId);
        const nameSnapshot = dom ? dom.name : 'General Sector';

        const task: Task = {
          ...taskFields,
          domainNameSnapshot: nameSnapshot,
        };

        storageService.addTask(task);
        
        // Clear drafts from localStorage since we submitted successfully
        localStorage.removeItem('student-assistant-task-draft');

        const newState = {
          ...prev,
          tasks: [...prev.tasks, task],
        };
        return newState;
      });
    },
    []
  );

  const updateTask = useCallback(
    (taskId: string, updatedFields: Partial<Task>) => {
      storageService.updateTask(taskId, updatedFields);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedFields } : t)),
      }));
    },
    []
  );

  const toggleTaskCompletion = useCallback(
    (taskId: string, logHours?: number, logNotes?: string) => {
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;

        const isNowCompleted = task.status !== 'completed';
        const now = Date.now();
        let logId: string | undefined;

        // If completed and hours logged, write to ActivityLog
        let updatedLogs = prev.activityLogs;
        if (isNowCompleted && logHours && logHours > 0) {
          logId = Math.random().toString(36).substring(2, 9);
          
          const newLog: ActivityLog = {
            id: logId,
            domainId: task.domainId,
            domainNameSnapshot: task.domainNameSnapshot, // Keep snapshot aligned
            topic: task.title,
            subdomain: task.subdomain,
            hoursSpent: logHours,
            notes: logNotes || undefined,
            source: 'task',
            date: new Date().setHours(0, 0, 0, 0),
            createdAt: now,
            updatedAt: now,
            linkedTaskId: taskId,
          };
          updatedLogs = [...updatedLogs, newLog];
          storageService.addActivityLog(newLog);
        }

        const updatedTaskFields: Partial<Task> = {
          status: isNowCompleted ? 'completed' : 'pending',
          completedAt: isNowCompleted ? now : undefined,
          linkedActivityLogId: isNowCompleted ? logId : undefined,
        };

        storageService.updateTask(taskId, updatedTaskFields);
        
        const newState = {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTaskFields } : t)),
          activityLogs: updatedLogs,
        };

        setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
        return newState;
      });
    },
    []
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      let deletedTask: Task | undefined;
      setState((prev) => {
        deletedTask = prev.tasks.find((t) => t.id === taskId);
        if (!deletedTask) return prev;

        storageService.deleteTask(taskId);
        
        const taskSnapshot = { ...deletedTask };
        registerUndo(() => {
          storageService.addTask(taskSnapshot);
          setState((p) => ({ ...p, tasks: [...p.tasks, taskSnapshot] }));
          setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
        }, `Task "${taskSnapshot.title}" deleted.`);

        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        };
      });
    },
    [registerUndo]
  );

  // --- Activity Log Operations (Actual execution) ---
  const addActivityLog = useCallback(
    (logFields: Omit<ActivityLog, 'domainNameSnapshot'>) => {
      setState((prev) => {
        const dom = prev.domains.find((d) => d.id === logFields.domainId);
        const nameSnapshot = dom ? dom.name : 'General Sector';

        const log: ActivityLog = {
          ...logFields,
          domainNameSnapshot: nameSnapshot,
        };

        storageService.addActivityLog(log);

        const newState = {
          ...prev,
          activityLogs: [...prev.activityLogs, log],
        };
        setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
        return newState;
      });
    },
    []
  );

  const updateActivityLog = useCallback(
    (logId: string, updatedLog: Partial<ActivityLog>) => {
      const fullUpdate = { ...updatedLog, updatedAt: Date.now() };
      storageService.updateActivityLog(logId, fullUpdate);
      setState((prev) => ({
        ...prev,
        activityLogs: prev.activityLogs.map((al) => (al.id === logId ? { ...al, ...fullUpdate } : al)),
      }));
      setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
    },
    []
  );

  const deleteActivityLog = useCallback(
    (logId: string) => {
      let deletedLog: ActivityLog | undefined;
      setState((prev) => {
        deletedLog = prev.activityLogs.find((al) => al.id === logId);
        if (!deletedLog) return prev;

        storageService.deleteActivityLog(logId);

        const logSnapshot = { ...deletedLog };
        registerUndo(() => {
          storageService.addActivityLog(logSnapshot);
          setState((p) => ({ ...p, activityLogs: [...p.activityLogs, logSnapshot] }));
          setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
        }, `Activity log for "${logSnapshot.topic}" deleted.`);

        return {
          ...prev,
          activityLogs: prev.activityLogs.filter((al) => al.id !== logId),
        };
      });
      setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
    },
    [registerUndo]
  );

  // --- Timer Operations (Single running timer constraint) ---
  const startTimer = useCallback(
    (domainId: string, topic: string, subdomain?: string, linkedTaskId?: string) => {
      setState((prev) => {
        const newState = { ...prev };
        const now = Date.now();

        // 1. Single active timer enforcement: stop and save any running timer
        Object.keys(newState.timerSessions).forEach((domId) => {
          const session = newState.timerSessions[domId];
          if (session && session.isActive) {
            let elapsedMs = 0;
            if (session.pausedAt !== null) {
              elapsedMs = session.pausedAt - session.startedAt - session.totalPausedTime;
            } else {
              elapsedMs = now - session.startedAt - session.totalPausedTime;
            }

            const hours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(3));
            if (hours > 0.005) { // Log session only if > 18 seconds
              const logId = Math.random().toString(36).substring(2, 9);
              const dom = newState.domains.find((d) => d.id === session.sectorId);
              const nameSnapshot = dom ? dom.name : 'General Sector';

              const newLog: ActivityLog = {
                id: logId,
                domainId: session.sectorId,
                domainNameSnapshot: nameSnapshot,
                topic: session.topic,
                subdomain: session.subdomain,
                hoursSpent: hours,
                source: 'timer',
                date: new Date().setHours(0, 0, 0, 0),
                createdAt: now,
                updatedAt: now,
                linkedTaskId: session.linkedTaskId || undefined,
              };
              newState.activityLogs = [...newState.activityLogs, newLog];
              storageService.addActivityLog(newLog);

              if (session.linkedTaskId) {
                newState.tasks = newState.tasks.map((t) =>
                  t.id === session.linkedTaskId
                    ? { ...t, status: 'completed', completedAt: now, linkedActivityLogId: logId }
                    : t
                );
                storageService.updateTask(session.linkedTaskId, {
                  status: 'completed',
                  completedAt: now,
                  linkedActivityLogId: logId,
                });
              }
            }

            storageService.deleteTimerSession(domId);
            const updatedSessions = { ...newState.timerSessions };
            delete updatedSessions[domId];
            newState.timerSessions = updatedSessions;
          }
        });

        // 2. Create the new timer session
        const newSession: TimerSession = {
          startedAt: now,
          pausedAt: null,
          totalPausedTime: 0,
          isActive: true,
          linkedTaskId: linkedTaskId || null,
          sectorId: domainId,
          topic: topic.trim(),
          subdomain: subdomain ? subdomain.trim() : undefined,
        };

        newState.timerSessions = {
          ...newState.timerSessions,
          [domainId]: newSession,
        };

        storageService.saveTimerSession(domainId, newSession);
        storageService.saveState(newState);
        
        setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
        return newState;
      });
    },
    []
  );

  const pauseTimer = useCallback((domainId: string) => {
    setState((prev) => {
      const session = prev.timerSessions[domainId];
      if (!session || !session.isActive || session.pausedAt !== null) return prev;

      const updatedSession: TimerSession = {
        ...session,
        pausedAt: Date.now(),
      };

      const newState = {
        ...prev,
        timerSessions: {
          ...prev.timerSessions,
          [domainId]: updatedSession,
        },
      };

      storageService.saveTimerSession(domainId, updatedSession);
      return newState;
    });
  }, []);

  const resumeTimer = useCallback((domainId: string) => {
    setState((prev) => {
      const session = prev.timerSessions[domainId];
      if (!session || !session.isActive || session.pausedAt === null) return prev;

      const pausedDuration = Date.now() - session.pausedAt;
      const updatedSession: TimerSession = {
        ...session,
        pausedAt: null,
        totalPausedTime: session.totalPausedTime + pausedDuration,
      };

      const newState = {
        ...prev,
        timerSessions: {
          ...prev.timerSessions,
          [domainId]: updatedSession,
        },
      };

      storageService.saveTimerSession(domainId, updatedSession);
      return newState;
    });
  }, []);

  const stopTimer = useCallback((domainId: string) => {
    let savedLog: ActivityLog | null = null;
    
    setState((prev) => {
      const session = prev.timerSessions[domainId];
      if (!session) return prev;

      const now = Date.now();
      let elapsedMs = 0;
      if (session.pausedAt !== null) {
        elapsedMs = session.pausedAt - session.startedAt - session.totalPausedTime;
      } else {
        elapsedMs = now - session.startedAt - session.totalPausedTime;
      }

      const hours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(3));
      let updatedLogs = prev.activityLogs;
      let updatedTasks = prev.tasks;

      if (hours > 0.001) { // Stop & log only if > 3 seconds
        const logId = Math.random().toString(36).substring(2, 9);
        const dom = prev.domains.find((d) => d.id === session.sectorId);
        const nameSnapshot = dom ? dom.name : 'General Sector';

        const newLog: ActivityLog = {
          id: logId,
          domainId: session.sectorId,
          domainNameSnapshot: nameSnapshot,
          topic: session.topic,
          subdomain: session.subdomain,
          hoursSpent: hours,
          source: 'timer',
          date: new Date().setHours(0, 0, 0, 0),
          createdAt: now,
          updatedAt: now,
          linkedTaskId: session.linkedTaskId || undefined,
        };

        updatedLogs = [...updatedLogs, newLog];
        storageService.addActivityLog(newLog);
        savedLog = newLog;

        if (session.linkedTaskId) {
          updatedTasks = prev.tasks.map((t) =>
            t.id === session.linkedTaskId
              ? { ...t, status: 'completed', completedAt: now, linkedActivityLogId: logId }
              : t
          );
          storageService.updateTask(session.linkedTaskId, {
            status: 'completed',
            completedAt: now,
            linkedActivityLogId: logId,
          });
        }
      }

      storageService.deleteTimerSession(domainId);
      const updatedSessions = { ...prev.timerSessions };
      delete updatedSessions[domainId];

      const newState = {
        ...prev,
        activityLogs: updatedLogs,
        tasks: updatedTasks,
        timerSessions: updatedSessions,
      };

      storageService.saveState(newState);
      setTimeout(() => analyticsService.recalculateAllAnalytics(), 0);
      return newState;
    });

    return savedLog;
  }, []);

  const cancelTimer = useCallback((domainId: string) => {
    setState((prev) => {
      storageService.deleteTimerSession(domainId);
      const updatedSessions = { ...prev.timerSessions };
      delete updatedSessions[domainId];

      const newState = {
        ...prev,
        timerSessions: updatedSessions,
      };

      storageService.saveState(newState);
      return newState;
    });
  }, []);

  // --- Life Activities ---
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
    setState(storageService.getDefaultState());
  }, []);

  const value: AppContextType = {
    state,
    isLoading,
    undoMessage,
    triggerUndo,
    clearUndo,
    setUser,
    addDomain,
    renameDomain,
    archiveDomain,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    addActivityLog,
    updateActivityLog,
    deleteActivityLog,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    cancelTimer,
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
