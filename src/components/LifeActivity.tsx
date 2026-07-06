'use client';

import React, { useState, useMemo } from 'react';
import { LifeActivity } from '@/types';
import { useApp } from '@/context/AppContext';
import { getTodayMidnight, formatHours } from '@/lib/utils';
import { Moon, Car, Utensils, Smartphone, Users, Plus, Trash2, AlertTriangle } from 'lucide-react';

export function LifeActivityTracker() {
  const { state, saveLifeActivity } = useApp();

  // Inputs state (Hours and Minutes)
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  
  const [travelHours, setTravelHours] = useState(1);
  const [travelMinutes, setTravelMinutes] = useState(0);
  
  const [mealsHours, setMealsHours] = useState(1);
  const [mealsMinutes, setMealsMinutes] = useState(30);
  
  const [scrollHours, setScrollHours] = useState(2);
  const [scrollMinutes, setScrollMinutes] = useState(0);
  
  const [socialHours, setSocialHours] = useState(1);
  const [socialMinutes, setSocialMinutes] = useState(0);

  // Custom fields state
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldHours, setCustomFieldHours] = useState(1);
  const [customFieldMinutes, setCustomFieldMinutes] = useState(0);
  const [customFieldsList, setCustomFieldsList] = useState<Record<string, number>>({});

  const todayMidnight = getTodayMidnight();
  const dateKey = useMemo(() => {
    return new Date(todayMidnight).toISOString().split('T')[0];
  }, [todayMidnight]);

  const todayActivity = useMemo(() => {
    return state.lifeActivities[dateKey] || null;
  }, [state.lifeActivities, dateKey]);

  // Load today's data if it exists
  React.useEffect(() => {
    if (todayActivity) {
      setSleepHours(Math.floor(todayActivity.sleep));
      setSleepMinutes(Math.round((todayActivity.sleep % 1) * 60));
      
      setTravelHours(Math.floor(todayActivity.travel));
      setTravelMinutes(Math.round((todayActivity.travel % 1) * 60));
      
      setMealsHours(Math.floor(todayActivity.meals));
      setMealsMinutes(Math.round((todayActivity.meals % 1) * 60));
      
      setScrollHours(Math.floor(todayActivity.scrollIdle));
      setScrollMinutes(Math.round((todayActivity.scrollIdle % 1) * 60));
      
      setSocialHours(Math.floor(todayActivity.socialize));
      setSocialMinutes(Math.round((todayActivity.socialize % 1) * 60));
      
      setCustomFieldsList(todayActivity.custom || {});
    }
  }, [todayActivity]);

  // Check custom field keywords to block double-counting
  const handleAddCustomField = () => {
    const name = customFieldName.trim();
    if (!name) return;

    // Block words containing "study", "coding", "practice", "work" (case insensitive)
    const blockedKeywords = [/study/i, /coding/i, /practice/i, /work/i, /academic/i, /programming/i];
    const isBlocked = blockedKeywords.some((regex) => regex.test(name));

    if (isBlocked) {
      alert(`⚠️ Category Name Blocked!\nPlease do not enter productive activities like "${name}" in Life Activity. Use the Tasks or Log Activity views instead to avoid double-counting hours.`);
      return;
    }

    const duration = customFieldHours + (customFieldMinutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    setCustomFieldsList((prev) => ({
      ...prev,
      [name]: parseFloat(duration.toFixed(2)),
    }));

    setCustomFieldName('');
    setCustomFieldHours(1);
    setCustomFieldMinutes(0);
  };

  const handleRemoveCustomField = (name: string) => {
    setCustomFieldsList((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activity: LifeActivity = {
      date: todayMidnight,
      sleep: sleepHours + (sleepMinutes / 60),
      travel: travelHours + (travelMinutes / 60),
      meals: mealsHours + (mealsMinutes / 60),
      scrollIdle: scrollHours + (scrollMinutes / 60),
      socialize: socialHours + (socialMinutes / 60),
      custom: customFieldsList,
    };

    saveLifeActivity(activity);
    alert('Life activities saved successfully!');
  };

  // 1. Calculate productive hours today (using ActivityLogs today as single source of truth)
  const productiveHoursToday = useMemo(() => {
    return state.activityLogs
      .filter((log) => {
        const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
        return logMidnight === todayMidnight;
      })
      .reduce((sum, log) => sum + (log.hoursSpent || 0), 0);
  }, [state.activityLogs, todayMidnight]);

  // 2. Calculate sum of life activities
  const sleepTotal = sleepHours + (sleepMinutes / 60);
  const travelTotal = travelHours + (travelMinutes / 60);
  const mealsTotal = mealsHours + (mealsMinutes / 60);
  const scrollTotal = scrollHours + (scrollMinutes / 60);
  const socialTotal = socialHours + (socialMinutes / 60);
  const customTotal = Object.values(customFieldsList).reduce((sum, v) => sum + v, 0);

  const lifeActivitiesTotal = sleepTotal + travelTotal + mealsTotal + scrollTotal + socialTotal + customTotal;
  const totalAccountedHours = lifeActivitiesTotal + productiveHoursToday;

  // 3. Validation and remaining hours calculations
  const isOverbooked = totalAccountedHours > 24;
  const remainingHours = Math.max(0, 24 - totalAccountedHours);

  // 4. Distribution segments for visual stacked bar
  const segments = useMemo(() => {
    const arr = [
      { key: 'sleep', label: 'Sleep', value: sleepTotal, color: '#3b82f6' }, // blue-500
      { key: 'travel', label: 'Travel', value: travelTotal, color: '#f59e0b' }, // amber-500
      { key: 'meals', label: 'Meals', value: mealsTotal, color: '#ef4444' }, // red-500
      { key: 'scroll', label: 'Scroll/Idle', value: scrollTotal, color: '#71717a' }, // zinc-500
      { key: 'social', label: 'Socialize', value: socialTotal, color: '#10b981' }, // emerald-500
      { key: 'productive', label: 'Productive Time', value: productiveHoursToday, color: '#8b5cf6' }, // purple-500
    ];

    // Add custom fields
    Object.keys(customFieldsList).forEach((name) => {
      arr.push({
        key: `custom_${name}`,
        label: name,
        value: customFieldsList[name],
        color: '#d946ef', // fuchsia-500
      });
    });

    // Add remaining segment if day not overbooked
    if (!isOverbooked && remainingHours > 0) {
      arr.push({
        key: 'remaining',
        label: 'Unallocated Time',
        value: remainingHours,
        color: '#18181b', // zinc-900
      });
    }

    return arr.filter((s) => s.value > 0);
  }, [sleepTotal, travelTotal, mealsTotal, scrollTotal, socialTotal, productiveHoursToday, customFieldsList, isOverbooked, remainingHours]);

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Life Activity Tracking</h2>
        <p className="text-sm text-zinc-400">Track your daily routine to understand your unallocated time balance.</p>
      </div>

      {/* Overbooked Alert */}
      {isOverbooked && (
        <div className="bg-red-950/20 border border-red-900/60 p-4 rounded-2xl flex items-start gap-3 text-red-400 animate-pulse">
          <AlertTriangle className="mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-bold">⚠️ Overbooked Day Detected</h4>
            <p className="text-xs leading-relaxed mt-0.5">
              The total logged hours ({totalAccountedHours.toFixed(1)} hrs) exceed 24 hours. Please review your logs to ensure accurate time distribution.
            </p>
          </div>
        </div>
      )}

      {/* ABSOLUTE TOP: Visual Utilizable Time & Accounted KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Remaining Productive Hours Card */}
        <div className="bg-gradient-to-br from-blue-950/20 to-zinc-900 border border-blue-900/40 p-5 rounded-2xl md:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Remaining Productive / Utilizable Hours</span>
            <h3 className={`text-4xl font-black mt-2 tracking-tight ${isOverbooked ? 'text-red-400' : remainingHours > 2 ? 'text-green-400' : 'text-amber-400'}`}>
              {remainingHours.toFixed(1)} <span className="text-sm font-semibold text-zinc-500">hrs remaining</span>
            </h3>
          </div>
          <p className="text-[11px] text-zinc-450 mt-4 leading-relaxed font-sans">
            {isOverbooked
              ? '🔴 Time balance is exhausted. You have entered more than 24 hours of activities today.'
              : remainingHours > 4
              ? '✅ Excellent! You have ample unallocated hours left to schedule study sessions, hobbies, or rest.'
              : '⚠️ Time is running short! Focus your remaining unallocated hours on high-priority tasks.'}
          </p>
        </div>

        {/* Day Accounting Card */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Logged Allocation</span>
            <div className="space-y-2 mt-3 text-xs font-semibold text-zinc-300">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Routine Activities:</span>
                <span>{lifeActivitiesTotal.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Productive Tasks:</span>
                <span>{productiveHoursToday.toFixed(1)}h</span>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-3 mt-3 flex justify-between items-baseline text-xs">
            <span className="text-zinc-500 font-medium">Total Accounted:</span>
            <span className="font-bold text-white">{totalAccountedHours.toFixed(1)} / 24 hrs</span>
          </div>
        </div>
      </div>

      {/* Stacked 24-Hour Progress Allocation Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-zinc-450">
          <span>Day Grid Timeline representation</span>
          <span>{totalAccountedHours.toFixed(1)} hrs accounted</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full bg-zinc-950 h-7 rounded-xl overflow-hidden flex border border-zinc-800 p-0.5">
          {segments.map((seg) => {
            const widthPct = (seg.value / 24) * 100;
            return (
              <div
                key={seg.key}
                className="h-full first:rounded-l-lg last:rounded-r-lg transition-all relative group cursor-help"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: seg.color,
                }}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-900 border border-zinc-700 text-zinc-100 text-[10px] px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-10 font-mono">
                  {seg.label}: {seg.value.toFixed(1)} hrs
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: seg.color }} />
              <span className="text-zinc-300">{seg.label}</span>
              <span className="text-zinc-500">({seg.value.toFixed(1)}h)</span>
            </div>
          ))}
          {!isOverbooked && remainingHours > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded bg-zinc-950 border border-zinc-850" />
              <span className="text-zinc-400">Remaining Unallocated</span>
              <span className="text-zinc-500">({remainingHours.toFixed(1)}h)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form Panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-5">
          <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Log Daily Categories</h3>

          {/* Sleep */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Moon className="text-blue-450" size={18} />
              <span className="text-sm font-semibold text-zinc-300">Sleep</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={sleepMinutes}
                  onChange={(e) => setSleepMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Travel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Car className="text-amber-400" size={18} />
              <span className="text-sm font-semibold text-zinc-300">Travel / Commute</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={travelHours}
                  onChange={(e) => setTravelHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={travelMinutes}
                  onChange={(e) => setTravelMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Meals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Utensils className="text-red-405" size={18} />
              <span className="text-sm font-semibold text-zinc-300">Eating / Meals</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={mealsHours}
                  onChange={(e) => setMealsHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-955 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={mealsMinutes}
                  onChange={(e) => setMealsMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-955 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Idle / Scrolling */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Smartphone className="text-zinc-400" size={18} />
              <span className="text-sm font-semibold text-zinc-300">Idle / Scroll Time</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={scrollHours}
                  onChange={(e) => setScrollHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={scrollMinutes}
                  onChange={(e) => setScrollMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Socialize */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Users className="text-emerald-400" size={18} />
              <span className="text-sm font-semibold text-zinc-300">Socialize / Touch Grass</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={socialHours}
                  onChange={(e) => setSocialHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={socialMinutes}
                  onChange={(e) => setSocialMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-4"
          >
            Save Life Activities
          </button>
        </form>

        {/* Custom fields Panel */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Add Custom Fields</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Family Time, Shopping"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder-zinc-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={customFieldHours}
                    onChange={(e) => setCustomFieldHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-955 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customFieldMinutes}
                    onChange={(e) => setCustomFieldMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-zinc-955 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomField}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>

            {/* Custom fields list */}
            {Object.keys(customFieldsList).length > 0 && (
              <div className="border-t border-zinc-800 pt-3 space-y-2">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Added custom items</p>
                <div className="grid gap-2">
                  {Object.keys(customFieldsList).map((name) => (
                    <div
                      key={name}
                      className="bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-200">{name}</span>
                        <span className="text-[10px] text-zinc-500">{formatHours(customFieldsList[name])}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomField(name)}
                        className="text-zinc-500 hover:text-red-400 p-1.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
