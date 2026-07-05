/**
 * Analytics Service - Version 2
 * Pulls exclusively from ActivityLogs as the single source of truth.
 * Computes streaks, weekly trends, sector breakdown, and average hours.
 */

import { Streak, DailyStats, AnalyticsData, ProductivityTrend } from '@/types';
import { storageService } from './storage';

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Sum hours for a specific domain on a date (midnight timestamp)
   */
  calculateHoursForDomainOnDate(domainId: string, dateNumber: number): number {
    const state = storageService.getState();
    const compareDate = new Date(dateNumber);
    compareDate.setHours(0, 0, 0, 0);
    const targetMidnight = compareDate.getTime();

    return state.activityLogs
      .filter((log) => {
        if (log.domainId !== domainId) return false;
        const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
        return logMidnight === targetMidnight;
      })
      .reduce((sum, log) => sum + (log.hoursSpent || 0), 0);
  }

  /**
   * Calculate daily stats for a specific date (midnight timestamp)
   */
  calculateDailyStats(dateNumber: number): DailyStats {
    const state = storageService.getState();
    const compareDate = new Date(dateNumber);
    compareDate.setHours(0, 0, 0, 0);
    const targetMidnight = compareDate.getTime();

    const domainsHours: Record<string, number> = {};
    let totalHours = 0;

    state.domains.forEach((domain) => {
      const hours = this.calculateHoursForDomainOnDate(domain.id, targetMidnight);
      domainsHours[domain.id] = hours;
      totalHours += hours;
    });

    // Count tasks completed on this date
    const tasksCompleted = state.tasks.filter((t) => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const completedMidnight = new Date(t.completedAt).setHours(0, 0, 0, 0);
      return completedMidnight === targetMidnight;
    }).length;

    // Standardized productivity score (0 - 100)
    // 10 points per hour (max 60pts for 6+ hours) + 10 points per completed task (max 40pts for 4+ tasks)
    const hoursScore = Math.min(totalHours * 10, 60);
    const taskScore = Math.min(tasksCompleted * 10, 40);
    const productivityScore = Math.round(hoursScore + taskScore);

    return {
      date: targetMidnight,
      totalHours,
      domainsHours,
      tasksCompleted,
      productivityScore,
    };
  }

  /**
   * Calculate current and longest active streaks for a domain (logged hours > 0)
   */
  calculateStreak(domainId: string): Streak {
    const state = storageService.getState();
    const domainLogs = state.activityLogs.filter(
      (log) => log.domainId === domainId && log.hoursSpent > 0
    );

    if (domainLogs.length === 0) {
      return {
        domainId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: 0,
      };
    }

    // Extract unique dates of activity
    const activeDates = new Set<string>();
    domainLogs.forEach((log) => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      activeDates.add(dateStr);
    });

    // Sort descending
    const sortedDates = Array.from(activeDates)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a);

    let currentStreak = 0;
    let longestStreak = 0;
    const lastActiveDate = sortedDates[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActiveMidnight = new Date(lastActiveDate);
    lastActiveMidnight.setHours(0, 0, 0, 0);

    // If last active was today or yesterday, streak is alive
    if (
      lastActiveMidnight.getTime() === today.getTime() ||
      lastActiveMidnight.getTime() === yesterday.getTime()
    ) {
      currentStreak = 1;
      // Count backwards
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i - 1]);
        const prev = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          break;
        }
      }
    }

    // Longest streak calculation
    let tempStreak = 1;
    longestStreak = 1;
    
    // Sort ascending for longest calculation
    const sortedAsc = [...sortedDates].sort((a, b) => a - b);
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1]);
      const curr = new Date(sortedAsc[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      domainId,
      currentStreak,
      longestStreak,
      lastActiveDate,
    };
  }

  /**
   * Calculate average daily hours spent (over the last N days)
   */
  calculateAverageHoursPerDay(days: number = 7): number {
    const state = storageService.getState();
    if (state.activityLogs.length === 0) return 0;

    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    const cutoff = todayMidnight - days * 24 * 60 * 60 * 1000;

    const filteredLogs = state.activityLogs.filter((log) => log.date >= cutoff);
    const totalHours = filteredLogs.reduce((sum, log) => sum + (log.hoursSpent || 0), 0);

    // Divide by unique logging days, or by the parameter days
    return totalHours / days;
  }

  /**
   * Get the most active sector (domainId and name) based on lifetime hours
   */
  getMostActiveSector(): { domainId: string; name: string; hours: number } | null {
    const state = storageService.getState();
    if (state.activityLogs.length === 0) return null;

    const hoursMap: Record<string, number> = {};
    state.activityLogs.forEach((log) => {
      hoursMap[log.domainId] = (hoursMap[log.domainId] || 0) + (log.hoursSpent || 0);
    });

    let topDomainId = '';
    let maxHours = -1;

    Object.keys(hoursMap).forEach((domId) => {
      if (hoursMap[domId] > maxHours) {
        maxHours = hoursMap[domId];
        topDomainId = domId;
      }
    });

    const domain = state.domains.find((d) => d.id === topDomainId);
    if (!domain) return null;

    return {
      domainId: topDomainId,
      name: domain.name,
      hours: maxHours,
    };
  }

  /**
   * Recalculate daily stats, streaks, trends, and update storage
   */
  recalculateAllAnalytics(): void {
    const state = storageService.getState();
    const streaks: Record<string, Streak> = {};

    state.domains.forEach((dom) => {
      streaks[dom.id] = this.calculateStreak(dom.id);
    });

    // Compute weekly trend data (past 7 days including today)
    const trends: ProductivityTrend[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dateKey = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      // Sum hours across all logs on this day
      const dailyHours = state.activityLogs
        .filter((log) => {
          const logDate = new Date(log.date).toISOString().split('T')[0];
          return logDate === dateKey;
        })
        .reduce((sum, log) => sum + (log.hoursSpent || 0), 0);

      trends.push({
        day: dayName,
        hoursTracked: parseFloat(dailyHours.toFixed(1)),
        dateKey,
      });
    }

    // Compute dailyStats mapping for last 30 days
    const dailyStats: Record<string, DailyStats> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString().split('T')[0];
      dailyStats[dateKey] = this.calculateDailyStats(d.getTime());
    }

    const averageHoursPerDay = this.calculateAverageHoursPerDay(7);

    const analytics: AnalyticsData = {
      dailyStats,
      streaks,
      trends,
      averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(1)),
    };

    storageService.updateAnalytics(analytics);
  }
}

export const analyticsService = AnalyticsService.getInstance();
