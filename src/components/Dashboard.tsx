'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getDailyQuote } from '@/lib/quotes';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Clock, CheckSquare, Flame, Calendar, BookOpen, Layers, CheckCircle2, ChevronRight } from 'lucide-react';

export function Dashboard() {
  const { state } = useApp();
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Load daily quote
  const dailyQuote = useMemo(() => getDailyQuote(), []);

  // Today's boundaries
  const todayMidnight = useMemo(() => {
    return new Date().setHours(0, 0, 0, 0);
  }, []);

  // Filter logs for today
  const logsToday = useMemo(() => {
    return state.activityLogs.filter((log) => {
      const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
      return logMidnight === todayMidnight;
    });
  }, [state.activityLogs, todayMidnight]);

  // Today's completed tasks
  const completedTasksToday = useMemo(() => {
    return state.tasks.filter((task) => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      const completedMidnight = new Date(task.completedAt).setHours(0, 0, 0, 0);
      return completedMidnight === todayMidnight;
    });
  }, [state.tasks, todayMidnight]);

  // Monitored hours sum today
  const monitoredHoursToday = useMemo(() => {
    return logsToday.reduce((sum, log) => sum + (log.hoursSpent || 0), 0);
  }, [logsToday]);

  // Expose active (non-archived) domains map for quick checks
  const domainColors = useMemo(() => {
    const map: Record<string, string> = {};
    state.domains.forEach((d) => {
      map[d.id] = d.color;
    });
    return map;
  }, [state.domains]);

  const domainNames = useMemo(() => {
    const map: Record<string, string> = {};
    state.domains.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [state.domains]);

  // Today's distribution for Pie Chart
  const pieData = useMemo(() => {
    const totals: Record<string, { name: string; value: number; color: string }> = {};

    logsToday.forEach((log) => {
      const name = log.domainNameSnapshot || domainNames[log.domainId] || 'Unknown';
      const color = domainColors[log.domainId] || '#6B7280';
      if (!totals[log.domainId]) {
        totals[log.domainId] = { name, value: 0, color };
      }
      totals[log.domainId].value += log.hoursSpent;
    });

    return Object.values(totals).map((item) => ({
      ...item,
      value: parseFloat(item.value.toFixed(2)),
    }));
  }, [logsToday, domainNames, domainColors]);

  // Subdomain breakdown of selected active domain today
  const barData = useMemo(() => {
    if (!selectedSectorId) return [];
    const totals: Record<string, number> = {};
    
    logsToday
      .filter((log) => log.domainId === selectedSectorId)
      .forEach((log) => {
        const sub = log.subdomain || 'General';
        totals[sub] = (totals[sub] || 0) + log.hoursSpent;
      });

    return Object.keys(totals).map((sub) => ({
      name: sub,
      hours: parseFloat(totals[sub].toFixed(2)),
    }));
  }, [logsToday, selectedSectorId]);

  // Recharts 7-Day Trend calculations
  const trendData = useMemo(() => {
    const weekLogs: Record<string, number> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize past 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const name = dayNames[d.getDay()];
      weekLogs[key] = 0;
      result.push({ day: name, dateKey: key, hours: 0 });
    }

    state.activityLogs.forEach((log) => {
      const dateKey = new Date(log.date).toISOString().split('T')[0];
      if (weekLogs[dateKey] !== undefined) {
        weekLogs[dateKey] += log.hoursSpent;
      }
    });

    return result.map((item) => ({
      ...item,
      hours: parseFloat(weekLogs[item.dateKey].toFixed(2)),
    }));
  }, [state.activityLogs]);

  // Streaks statistics
  const currentStreak = useMemo(() => {
    const streaks = state.analytics?.streaks || {};
    // Get maximum active streak across domains
    const vals = Object.values(streaks);
    if (vals.length === 0) return 0;
    return Math.max(...vals.map((s) => s.currentStreak), 0);
  }, [state.analytics]);

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
      
      {/* Curved Dark Quote Widget */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col items-center text-center max-w-4xl mx-auto shadow-sm">
        <p className="text-xs italic text-zinc-300 font-medium">&quot;{dailyQuote.text}&quot;</p>
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider mt-1.5">— {dailyQuote.author}</span>
      </div>

      {/* Side-by-Side EQUAL Balanced KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Monitored Hours */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-750 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-bold">Monitored Hours Today</span>
              <Clock size={16} className="text-blue-500" />
            </div>
            <h3 className="text-3xl font-black mt-3 tracking-tight text-white">
              {monitoredHoursToday.toFixed(1)} <span className="text-sm font-semibold text-zinc-500">hrs</span>
            </h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 font-semibold">Tracked from timers and logs</p>
        </div>

        {/* KPI 2: Completed Tasks */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-750 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-bold">Tasks Completed Today</span>
              <CheckSquare size={16} className="text-green-500" />
            </div>
            <h3 className="text-3xl font-black mt-3 tracking-tight text-white">
              {completedTasksToday.length} <span className="text-sm font-semibold text-zinc-500">tasks</span>
            </h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 font-semibold">Value completion over tracking time</p>
        </div>

        {/* KPI 3: Max Domain Streak */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-750 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-bold">Highest Active Streak</span>
              <Flame size={16} className="text-orange-500 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black mt-3 tracking-tight text-white">
              {currentStreak} <span className="text-sm font-semibold text-zinc-500">days</span>
            </h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 font-semibold">Keep up your daily consistency</p>
        </div>
      </div>

      {/* Main Charts & Completed Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Distribution & Completed Feed */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Pie Chart Card */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Layers size={15} className="text-blue-500" />
              Sector Allocation Today
            </h3>

            {pieData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#fafafa', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom legends */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-350">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="truncate">{entry.name}</span>
                      <span className="text-zinc-500">({entry.value}h)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-10">No hours logged today.</p>
            )}
          </div>

          {/* Today's Completed Tasks scrollable list */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-500" />
              Completed Feed Today
            </h3>
            
            {completedTasksToday.length > 0 ? (
              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {completedTasksToday.map((task) => {
                  const color = domainColors[task.domainId] || '#6B7280';
                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl flex flex-col gap-1 hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-zinc-300 leading-tight">{task.title}</span>
                        {task.completedAt && (
                          <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">
                            {new Date(task.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[9px] text-zinc-500 font-bold">{task.domainNameSnapshot}</span>
                        {task.subdomain && (
                          <span className="text-[9px] text-zinc-650 bg-zinc-900 px-1 py-0.5 rounded font-medium">
                            {task.subdomain}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">No tasks completed today yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Hours Trend & Interactive Subdomains */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weekly Area Trend Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Calendar size={15} className="text-blue-500" />
              Weekly Productivity Hours
            </h3>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#fafafa', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3B82F6', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="hours" name="Hours" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Sectors List and Subdomain breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-300">Interact with Sectors</h3>
            
            {/* Clickable Sector Badges */}
            <div className="flex flex-wrap gap-2">
              {state.domains.map((dom) => {
                const logsForDom = logsToday.filter((l) => l.domainId === dom.id);
                const hrs = logsForDom.reduce((s, l) => s + l.hoursSpent, 0);
                const isSelected = selectedSectorId === dom.id;

                return (
                  <button
                    key={dom.id}
                    onClick={() => setSelectedSectorId(isSelected ? null : dom.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>{dom.icon || '📌'}</span>
                    <span>{dom.name}</span>
                    <span className="text-[10px] text-zinc-550">({hrs.toFixed(1)}h)</span>
                    <ChevronRight size={12} className={`transform transition-transform ${isSelected ? 'rotate-90 text-blue-400' : 'text-zinc-650'}`} />
                  </button>
                );
              })}
            </div>

            {/* Subdomain Bar Chart for selected sector */}
            {selectedSectorId && (
              <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-500" />
                  Subdomain Breakdown for &quot;{domainNames[selectedSectorId]}&quot; today
                </h4>

                {barData.length > 0 ? (
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <XAxis type="number" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} axisLine={false} width={70} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#fafafa', fontSize: '10px' }}
                        />
                        <Bar dataKey="hours" name="Hours" fill={domainColors[selectedSectorId] || '#3B82F6'} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">No hours logged for this sector today.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
