/**
 * Analytics Service
 * Calculate productivity scores, streaks, trends, and insights
 */

import { TaskEntry, AnalyticsData, DailyStats, Streak, DomainTask } from '@/types';
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
   * Calculate total hours for a domain on a specific date
   */
  calculateHoursForDomainOnDate(domainId: string, dateNumber: number): number {
    const state = storageService.getState();
    const tasks = state.tasks.filter((t) => {
      if (t.domainId !== domainId) return false;
      const taskDate = new Date(t.data.date);
      const compareDate = new Date(dateNumber);
      return (
        taskDate.getFullYear() === compareDate.getFullYear() &&
        taskDate.getMonth() === compareDate.getMonth() &&
        taskDate.getDate() === compareDate.getDate()
      );
    });

    return tasks.reduce((sum, task) => {
      const taskData = task.data as any;
      return sum + (taskData.hoursSpent || 0);
    }, 0);
  }

  /**
   * Calculate daily stats for a specific date
   */
  calculateDailyStats(dateNumber: number): DailyStats {
    const state = storageService.getState();
    const dateKey = new Date(dateNumber).toISOString().split('T')[0];

    const domainsHours: Record<string, number> = {};
    let totalHours = 0;

    state.domains.forEach((domain) => {
      const hours = this.calculateHoursForDomainOnDate(domain.id, dateNumber);
      domainsHours[domain.id] = hours;
      totalHours += hours;
    });

    const dayTasks = state.tasks.filter((t) => {
      const taskDate = new Date(t.data.date);
      const compareDate = new Date(dateNumber);
      return (
        taskDate.getFullYear() === compareDate.getFullYear() &&
        taskDate.getMonth() === compareDate.getMonth() &&
        taskDate.getDate() === compareDate.getDate()
      );
    });

    const tasksCompleted = dayTasks.filter(
      (t) => {
        const taskData = t.data as any;
        return taskData.completed !== false;
      }
    ).length;

    const productivityScore = this.calculateProductivityScore(
      totalHours,
      tasksCompleted
    );

    const avgProductivityPerDomain: Record<string, number> = {};
    state.domains.forEach((domain) => {
      const domainTasks = dayTasks.filter((t) => t.domainId === domain.id);
      if (domainTasks.length > 0) {
        avgProductivityPerDomain[domain.id] =
          domainTasks.filter((t) => (t.data as any).completed !== false).length /
          domainTasks.length;
      }
    });

    return {
      date: dateNumber,
      totalHours,
      domainsHours,
      tasksCompleted,
      productivityScore,
      avgProductivityPerDomain,
    };
  }

  /**
   * Calculate productivity score (0-100)
   */
  calculateProductivityScore(hoursTracked: number, tasksCompleted: number): number {
    // Score formula: weighted combination of hours and task completion
    const hoursScore = Math.min(hoursTracked * 10, 50); // Max 50 points for 5+ hours
    const taskScore = Math.min(tasksCompleted * 10, 50); // Max 50 points for 5+ tasks
    return Math.round(hoursScore + taskScore);
  }

  /**
   * Calculate streak for a domain
   */
  calculateStreak(domainId: string): Streak {
    const state = storageService.getState();
    const domainTasks = state.tasks.filter((t) => t.domainId === domainId);

    if (domainTasks.length === 0) {
      return {
        domainId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: 0,
      };
    }

    // Get unique dates with tasks
    const activeDates = new Set<string>();
    domainTasks.forEach((task) => {
      const dateStr = new Date(task.data.date).toISOString().split('T')[0];
      activeDates.add(dateStr);
    });

    const sortedDates = Array.from(activeDates)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a);

    if (sortedDates.length === 0) {
      return {
        domainId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: 0,
      };
    }

    let currentStreak = 1;
    let longestStreak = 1;
    const lastActiveDate = sortedDates[0];

    // Check if today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActiveTime = new Date(sortedDates[0]);
    lastActiveTime.setHours(0, 0, 0, 0);

    if (
      lastActiveTime.getTime() !== today.getTime() &&
      lastActiveTime.getTime() !== yesterday.getTime()
    ) {
      currentStreak = 0; // Streak broken
    } else {
      // Count consecutive days
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i - 1]);
        const prev = new Date(sortedDates[i]);
        const diffDays =
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Find longest streak
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const curr = new Date(sortedDates[i - 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return {
      domainId,
      currentStreak,
      longestStreak,
      lastActiveDate,
    };
  }

  /**
   * Get most productive hour (from tasks)
   */
  getMostProductiveHour(): number | undefined {
    const state = storageService.getState();
    const hourMap: Record<number, number> = {};

    state.tasks.forEach((task) => {
      const date = new Date(task.data.date);
      const hour = date.getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });

    if (Object.keys(hourMap).length === 0) {
      return undefined;
    }

    return parseInt(
      Object.keys(hourMap).reduce((a, b) =>
        hourMap[parseInt(a)] > hourMap[parseInt(b)] ? a : b
      )
    );
  }

  /**
   * Calculate average hours per day
   */
  calculateAverageHoursPerDay(days: number = 30): number {
    const state = storageService.getState();
    if (state.tasks.length === 0) return 0;

    const now = Date.now();
    const cutoffDate = now - days * 24 * 60 * 60 * 1000;

    const relevantTasks = state.tasks.filter((t) => t.data.date >= cutoffDate);
    if (relevantTasks.length === 0) return 0;

    const totalHours = relevantTasks.reduce((sum, t) => {
      const taskData = t.data as any;
      return sum + (taskData.hoursSpent || 0);
    }, 0);

    // Count unique days
    const uniqueDays = new Set<string>();
    relevantTasks.forEach((t) => {
      const dateStr = new Date(t.data.date).toISOString().split('T')[0];
      uniqueDays.add(dateStr);
    });

    return totalHours / uniqueDays.size;
  }

  /**
   * Detect burnout risk (Low, Medium, High)
   */
  detectBurnoutRisk(): 'Low' | 'Medium' | 'High' {
    const state = storageService.getState();
    const avgHours = this.calculateAverageHoursPerDay(7);

    if (avgHours > 10) {
      return 'High';
    } else if (avgHours > 6) {
      return 'Medium';
    }
    return 'Low';
  }

  /**
   * Generate productivity patterns
   */
  generatePatterns(): string[] {
    const state = storageService.getState();
    const patterns: string[] = [];

    if (state.tasks.length === 0) {
      return ['Start tracking to see patterns'];
    }

    // Find most active domain
    const domainHours: Record<string, number> = {};
    state.tasks.forEach((task) => {
      const taskData = task.data as any;
      domainHours[task.domainId] =
        (domainHours[task.domainId] || 0) + (taskData.hoursSpent || 0);
    });

    const topDomain = Object.keys(domainHours).reduce((a, b) =>
      domainHours[a] > domainHours[b] ? a : b
    );

    const topDomainObj = state.domains.find((d) => d.id === topDomain);
    if (topDomainObj) {
      patterns.push(`${topDomainObj.name} is your most focused area`);
    }

    const hoursPerDay = this.calculateAverageHoursPerDay(7);
    if (hoursPerDay < 2) {
      patterns.push('You can increase your daily tracking time');
    } else if (hoursPerDay > 8) {
      patterns.push('You have high productivity - watch for burnout');
    }

    return patterns;
  }

  /**
   * Get recommendations
   */
  getRecommendations(): string[] {
    const patterns = this.generatePatterns();
    const burnoutRisk = this.detectBurnoutRisk();
    const recommendations: string[] = [];

    recommendations.push('Stay consistent with daily tracking');

    if (burnoutRisk === 'High') {
      recommendations.push('Consider taking breaks - you are working hard!');
    }

    if (patterns.some((p) => p.includes('increase'))) {
      recommendations.push('Try dedicating 30 minutes more to your studies');
    }

    return recommendations;
  }

  /**
   * Recalculate all analytics
   */
  recalculateAllAnalytics(): void {
    const state = storageService.getState();
    const analytics: AnalyticsData = {
      dailyStats: {},
      streaks: {},
      trends: [],
      mostProductiveHour: this.getMostProductiveHour(),
      averageHoursPerDay: this.calculateAverageHoursPerDay(),
    };

    // Calculate streaks for all domains
    state.domains.forEach((domain) => {
      analytics.streaks[domain.id] = this.calculateStreak(domain.id);
    });

    // Calculate stats for last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      analytics.dailyStats[dateStr] = this.calculateDailyStats(date.getTime());
    }

    storageService.updateAnalytics(analytics);
  }
}

export const analyticsService = AnalyticsService.getInstance();
