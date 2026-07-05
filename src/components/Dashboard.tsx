'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { analyticsService } from '@/lib/analytics';
import { formatHours, getTodayMidnight } from '@/lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Clock, Flame, BarChart3, Star, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function Dashboard() {
  const { state } = useApp();
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const todayMidnight = useMemo(() => getTodayMidnight(), []);
  const todayStr = useMemo(() => new Date(todayMidnight).toISOString().split('T')[0], [todayMidnight]);

  // 1. Memoized Daily Stats for Today
  const todayStats = useMemo(() => {
    const domainsHours: Record<string, number> = {};
    let totalHours = 0;

    state.domains.forEach((dom) => {
      // Sum logs for this domain today
      const hours = state.activityLogs
        .filter((log) => {
          if (log.domainId !== dom.id) return false;
          const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
          return logMidnight === todayMidnight;
        })
        .reduce((sum, log) => sum + log.hoursSpent, 0);
      
      domainsHours[dom.id] = hours;
      totalHours += hours;
    });

    return {
      totalHours,
      domainsHours,
    };
  }, [state.activityLogs, state.domains, todayMidnight]);

  // 2. Memoized Sector Streaks
  const streaksMap = useMemo(() => {
    const map: Record<string, { current: number; best: number }> = {};
    state.domains.forEach((dom) => {
      const streakObj = analyticsService.calculateStreak(dom.id);
      map[dom.id] = {
        current: streakObj.currentStreak,
        best: streakObj.longestStreak,
      };
    });
    return map;
  }, [state.activityLogs, state.domains]);

  // 3. Memoized Most Active Sector
  const mostActiveSector = useMemo(() => {
    return analyticsService.getMostActiveSector();
  }, [state.activityLogs, state.domains]);

  // 4. Memoized Weekly Trend Data (past 7 days)
  const weeklyTrendData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const hours = state.activityLogs
        .filter((log) => new Date(log.date).toISOString().split('T')[0] === dateKey)
        .reduce((sum, log) => sum + log.hoursSpent, 0);

      data.push({
        day: dayName,
        Hours: parseFloat(hours.toFixed(2)),
      });
    }
    return data;
  }, [state.activityLogs]);

  const weeklyAverage = useMemo(() => {
    const totalHours = weeklyTrendData.reduce((sum, day) => sum + day.Hours, 0);
    return parseFloat((totalHours / 7).toFixed(1));
  }, [weeklyTrendData]);

  // 5. Pie Chart Data (today's hours distribution)
  const pieChartData = useMemo(() => {
    return state.domains
      .map((dom) => ({
        name: dom.name,
        value: parseFloat((todayStats.domainsHours[dom.id] || 0).toFixed(2)),
        color: dom.color,
      }))
      .filter((d) => d.value > 0);
  }, [state.domains, todayStats]);

  // 6. Selected Sector Subdomain Breakdown
  const subdomainBreakdown = useMemo(() => {
    if (!selectedDomainId) return [];

    // Group logs of this domain by subdomain/subject
    const groupings: Record<string, number> = {};
    state.activityLogs
      .filter((log) => log.domainId === selectedDomainId)
      .forEach((log) => {
        const sub = log.subdomain || 'General / Uncategorized';
        groupings[sub] = (groupings[sub] || 0) + log.hoursSpent;
      });

    return Object.keys(groupings).map((sub) => ({
      subdomain: sub,
      Hours: parseFloat(groupings[sub].toFixed(2)),
    })).sort((a, b) => b.Hours - a.Hours);
  }, [state.activityLogs, selectedDomainId]);

  const selectedDomainName = useMemo(() => {
    if (!selectedDomainId) return '';
    return state.domains.find((d) => d.id === selectedDomainId)?.name || 'Custom Sector';
  }, [state.domains, selectedDomainId]);

  // Date formatting for dashboard subtitle
  const readableTodayDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-zinc-400">{readableTodayDate}</p>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Hours */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Hours Today</p>
            <p className="text-xl font-bold text-white mt-1">{formatHours(todayStats.totalHours)}</p>
          </div>
        </div>

        {/* Global/Active Streak */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Max Active Streak</p>
            <p className="text-xl font-bold text-white mt-1">
              {Math.max(...Object.values(streaksMap).map((s) => s.current), 0)} Days
            </p>
          </div>
        </div>

        {/* Weekly Avg */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">7-Day Avg</p>
            <p className="text-xl font-bold text-white mt-1">{formatHours(weeklyAverage)}</p>
          </div>
        </div>

        {/* Most Active Sector */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Star size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Top Sector</p>
            <p className="text-base font-bold text-white mt-1.5 truncate">
              {mostActiveSector ? mostActiveSector.name : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Sector Cards - Hours spent per sector */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Tracking Sectors</h3>
        
        {state.domains.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {state.domains.map((dom) => {
              const hrsToday = todayStats.domainsHours[dom.id] || 0;
              const streak = streaksMap[dom.id] || { current: 0, best: 0 };
              const isSelected = selectedDomainId === dom.id;

              return (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomainId(isSelected ? null : dom.id)}
                  className={`bg-zinc-900 border p-4 rounded-2xl flex flex-col text-left transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : 'border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-2xl">{dom.icon || '📌'}</span>
                    
                    {streak.current > 0 && (
                      <span className="flex items-center text-[10px] font-bold text-amber-500 gap-0.5" title="Active Streak">
                        <Flame size={12} fill="#f59e0b" /> {streak.current}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-bold text-white mt-3 leading-tight">{dom.name}</h4>
                  
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-xl font-black text-white">{hrsToday.toFixed(1)}</span>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">hrs today</span>
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-zinc-450 self-end">
                    <span>Breakdown</span>
                    {isSelected ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-850 p-6 text-center text-zinc-500 rounded-2xl">
            <AlertCircle className="mx-auto text-zinc-600 mb-2" />
            <p className="font-semibold text-sm">No sectors active. Complete onboarding or add custom domains.</p>
          </div>
        )}
      </div>

      {/* Expanded subdomains breakdown list & Recharts Bar Chart */}
      {selectedDomainId && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 space-y-5 animate-slide-down">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{state.domains.find((d) => d.id === selectedDomainId)?.icon || '📌'}</span>
              {selectedDomainName} Breakdown
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Hours logged by specific subjects / subdomains</p>
          </div>

          {subdomainBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Table/List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {subdomainBreakdown.map((row, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-zinc-200">{row.subdomain}</span>
                    <span className="font-mono font-black text-white bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
                      {formatHours(row.Hours)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bar Chart */}
              <div className="h-[220px] bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subdomainBreakdown} layout="vertical">
                    <XAxis type="number" stroke="#52525b" fontSize={10} />
                    <YAxis dataKey="subdomain" type="category" stroke="#52525b" fontSize={9} width={90} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#fafafa', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                    />
                    <Bar dataKey="Hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-4 text-center">No logs recorded in this sector yet.</p>
          )}
        </div>
      )}

      {/* Visualizations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie/Donut Chart: Sector Distribution */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            Sector Allocation Today
          </h3>
          
          {pieChartData.length > 0 ? (
            <div className="h-[200px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '10px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner details */}
              <div className="absolute text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total</span>
                <p className="text-lg font-black text-white leading-tight">{todayStats.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 text-xs text-center p-4">
              Log sector hours or use timers to visualize sector allocation.
            </div>
          )}
        </div>

        {/* AreaChart: Weekly Trend */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
            7-Day Activity Trend
          </h3>
          
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#fafafa', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Hours" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
