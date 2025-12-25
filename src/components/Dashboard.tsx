'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { analyticsService } from '@/lib/analytics';
import { formatHours, getTodayMidnight, formatDateReadable, calculatePercentage } from '@/lib/utils';

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function ChartBar({ label, value, maxValue, color }: ChartBarProps) {
  const percentage = calculatePercentage(value, maxValue || 1);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{formatHours(value)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
}

function StatCard({ icon, label, value, subtext, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      {trend && (
        <div className="mt-2 text-xs font-semibold">
          {trend === 'up' && <span className="text-green-600">↑ Trending Up</span>}
          {trend === 'down' && <span className="text-red-600">↓ Trending Down</span>}
          {trend === 'stable' && <span className="text-gray-600">→ Stable</span>}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { state } = useApp();

  const todayStats = useMemo(() => {
    return analyticsService.calculateDailyStats(getTodayMidnight());
  }, [state.tasks, state.domains]);

  const streaks = useMemo(() => {
    return state.domains.map((domain) => ({
      domain,
      streak: analyticsService.calculateStreak(domain.id),
    }));
  }, [state.domains]);

  const avgHours = analyticsService.calculateAverageHoursPerDay(7);
  const burnoutRisk = analyticsService.detectBurnoutRisk();
  const patterns = analyticsService.generatePatterns();
  const recommendations = analyticsService.getRecommendations();
  const mostProductiveHour = analyticsService.getMostProductiveHour();

  const maxDomainHours = Math.max(...Object.values(todayStats.domainsHours), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">{formatDateReadable(getTodayMidnight())}</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="⏱️"
          label="Today's Hours"
          value={formatHours(todayStats.totalHours)}
          subtext={`${todayStats.tasksCompleted} tasks completed`}
        />
        <StatCard
          icon="🎯"
          label="Productivity Score"
          value={`${todayStats.productivityScore}%`}
          trend={todayStats.productivityScore >= 70 ? 'up' : todayStats.productivityScore >= 40 ? 'stable' : 'down'}
        />
        <StatCard
          icon="📈"
          label="7-Day Average"
          value={formatHours(avgHours)}
          subtext="per day"
        />
        <StatCard
          icon={burnoutRisk === 'High' ? '🔥' : burnoutRisk === 'Medium' ? '⚠️' : '✅'}
          label="Burnout Risk"
          value={burnoutRisk}
          subtext="Based on your activity"
        />
      </div>

      {/* Domain Breakdown */}
      {state.domains.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Today's Time by Domain</h2>
          <div className="space-y-4">
            {state.domains.map((domain) => (
              <ChartBar
                key={domain.id}
                label={domain.name}
                value={todayStats.domainsHours[domain.id] || 0}
                maxValue={maxDomainHours}
                color={domain.color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Streaks */}
      {streaks.some((s) => s.streak.currentStreak > 0) && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">🔥 Streaks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {streaks.map(
              ({ domain, streak }) =>
                streak.currentStreak > 0 && (
                  <div
                    key={domain.id}
                    className="p-4 rounded-lg border-2"
                    style={{ borderColor: domain.color, backgroundColor: domain.color + '15' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{domain.name}</p>
                        <p className="text-sm text-gray-600">Current: {streak.currentStreak} days</p>
                        <p className="text-xs text-gray-500">Best: {streak.longestStreak} days</p>
                      </div>
                      <span className="text-3xl">🔥</span>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patterns */}
        {patterns.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4">📊 Patterns</h3>
            <div className="space-y-3">
              {patterns.map((pattern, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <p className="text-sm text-gray-700">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold mb-4">💡 Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-600 font-bold mt-0.5">→</span>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Most Productive Hour */}
      {mostProductiveHour !== undefined && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Most Productive Hour</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {String(mostProductiveHour).padStart(2, '0')}:00
              </p>
            </div>
            <span className="text-5xl">⚡</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {state.tasks.length === 0 && (
        <div className="bg-white rounded-lg p-8 border border-dashed border-gray-300 text-center">
          <p className="text-2xl mb-2">📝</p>
          <p className="text-gray-600 font-semibold">No tasks tracked yet</p>
          <p className="text-sm text-gray-500 mt-1">Start by adding tasks to your domains</p>
        </div>
      )}
    </div>
  );
}
