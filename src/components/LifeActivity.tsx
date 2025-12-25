'use client';

import React, { useState, useMemo } from 'react';
import { LifeActivity } from '@/types';
import { useApp } from '@/context/AppContext';
import { getTodayMidnight, formatHours, timeToHours } from '@/lib/utils';

export function LifeActivityTracker() {
  const { state, saveLifeActivity } = useApp();
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [eatingHours, setEatingHours] = useState(1);
  const [eatingMinutes, setEatingMinutes] = useState(0);
  const [travelHours, setTravelHours] = useState(1);
  const [travelMinutes, setTravelMinutes] = useState(0);
  const [idleHours, setIdleHours] = useState(2);
  const [idleMinutes, setIdleMinutes] = useState(0);
  const [sleepQuality, setSleepQuality] = useState<'Poor' | 'Fair' | 'Good' | 'Excellent'>('Good');

  const todayMidnight = getTodayMidnight();
  const todayActivity = useMemo(() => {
    const dateKey = new Date(todayMidnight).toISOString().split('T')[0];
    return state.lifeActivities[dateKey] || null;
  }, [state.lifeActivities, todayMidnight]);

  // Load today's data if exists
  React.useEffect(() => {
    if (todayActivity) {
      setSleepHours(Math.floor(todayActivity.sleep.hours));
      setSleepMinutes(Math.round((todayActivity.sleep.hours % 1) * 60));
      setSleepQuality(todayActivity.sleep.quality || 'Good');
      setEatingHours(Math.floor(todayActivity.eating));
      setEatingMinutes(Math.round((todayActivity.eating % 1) * 60));
      setTravelHours(Math.floor(todayActivity.travel));
      setTravelMinutes(Math.round((todayActivity.travel % 1) * 60));
      setIdleHours(Math.floor(todayActivity.idleScrolling));
      setIdleMinutes(Math.round((todayActivity.idleScrolling % 1) * 60));
    }
  }, [todayActivity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activity: LifeActivity = {
      date: todayMidnight,
      sleep: {
        hours: timeToHours(sleepHours, sleepMinutes),
        quality: sleepQuality,
      },
      eating: timeToHours(eatingHours, eatingMinutes),
      travel: timeToHours(travelHours, travelMinutes),
      idleScrolling: timeToHours(idleHours, idleMinutes),
    };

    saveLifeActivity(activity);
    alert('Life activity logged successfully!');
  };

  // Calculate untracked hours
  const totalTrackedActivity =
    timeToHours(sleepHours, sleepMinutes) +
    timeToHours(eatingHours, eatingMinutes) +
    timeToHours(travelHours, travelMinutes) +
    timeToHours(idleHours, idleMinutes);

  const todayTotalHours = state.analytics.dailyStats[new Date(todayMidnight).toISOString().split('T')[0]]?.totalHours || 0;
  const untrackedHours = Math.max(0, 24 - totalTrackedActivity - todayTotalHours);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Life Activity Tracking</h1>
        <p className="text-gray-600 mt-1">Track your daily routine to calculate available productive time</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-gray-200 space-y-6">
        {/* Sleep */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">😴</span>
            <h3 className="text-lg font-bold">Sleep</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={sleepMinutes}
                onChange={(e) => setSleepMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Sleep Quality</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Poor', 'Fair', 'Good', 'Excellent'] as const).map((quality) => (
                <button
                  key={quality}
                  type="button"
                  onClick={() => setSleepQuality(quality)}
                  className={`p-2 rounded-lg font-medium transition-colors text-sm ${
                    sleepQuality === quality
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Eating */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🍽️</span>
            <h3 className="text-lg font-bold">Eating / Meals</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={eatingHours}
                onChange={(e) => setEatingHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={eatingMinutes}
                onChange={(e) => setEatingMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Travel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🚗</span>
            <h3 className="text-lg font-bold">Travel / Commute</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={travelHours}
                onChange={(e) => setTravelHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={travelMinutes}
                onChange={(e) => setTravelMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Idle / Scrolling */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📱</span>
            <h3 className="text-lg font-bold">Idle / Scrolling Time</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={idleHours}
                onChange={(e) => setIdleHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={idleMinutes}
                onChange={(e) => setIdleMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Save Life Activity
        </button>
      </form>

      {/* Time Summary Card */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-bold mb-4">📊 Daily Time Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Sleep</span>
            <span className="font-bold text-lg">{formatHours(timeToHours(sleepHours, sleepMinutes))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Eating</span>
            <span className="font-bold text-lg">{formatHours(timeToHours(eatingHours, eatingMinutes))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Travel</span>
            <span className="font-bold text-lg">{formatHours(timeToHours(travelHours, travelMinutes))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Idle / Scrolling</span>
            <span className="font-bold text-lg">{formatHours(timeToHours(idleHours, idleMinutes))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Tracked Productivity</span>
            <span className="font-bold text-lg">{formatHours(todayTotalHours)}</span>
          </div>
          <hr className="border-gray-300" />
          <div className="flex justify-between items-center bg-white rounded p-3">
            <span className="font-semibold text-gray-900">⏳ Untracked Time Available</span>
            <span className={`font-bold text-lg ${untrackedHours > 2 ? 'text-green-600' : 'text-orange-600'}`}>
              {formatHours(untrackedHours)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {untrackedHours > 2
              ? '✅ Good! You have time for optimization or self-care'
              : untrackedHours > 0
              ? '⚠️ Limited time available - consider prioritizing'
              : '🔴 No time left - ensure you capture all activities'}
          </p>
        </div>
      </div>
    </div>
  );
}
