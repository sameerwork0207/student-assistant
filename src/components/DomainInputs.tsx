'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ActivityLog } from '@/types';
import { Play, Pause, Square, Trash2 } from 'lucide-react';

interface DomainInputProps {
  domainId: string;
  domainName: string;
  onTaskAdded?: () => void;
}

/**
 * Reusable, persistent Timer Control Component
 */
function TimerLoggingControl({
  domainId,
  topic,
  subdomain,
  onStopSuccess,
}: {
  domainId: string;
  topic: string;
  subdomain?: string;
  onStopSuccess?: () => void;
}) {
  const { state, startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer } = useApp();
  const [localElapsed, setLocalElapsed] = useState(0);

  const session = state.timerSessions[domainId] || null;

  // Running Timer Duration Updates (Crash-resilient calculations)
  useEffect(() => {
    if (!session || !session.isActive) {
      Promise.resolve().then(() => {
        setLocalElapsed(0);
      });
      return;
    }

    const updateElapsed = () => {
      const now = Date.now();
      let elapsed = 0;
      if (session.pausedAt !== null) {
        elapsed = session.pausedAt - session.startedAt - session.totalPausedTime;
      } else {
        elapsed = now - session.startedAt - session.totalPausedTime;
      }
      setLocalElapsed(Math.max(0, elapsed));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 500);
    return () => clearInterval(interval);
  }, [session]);

  const handleStart = () => {
    if (!topic.trim()) {
      alert('Please enter a Topic or Subject before starting the timer.');
      return;
    }
    // Normalize text
    const normalizedTopic = topic.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSubdomain = subdomain?.trim()
      ? subdomain.trim().replace(/\b\w/g, c => c.toUpperCase())
      : undefined;

    startTimer(domainId, normalizedTopic, normalizedSubdomain);
  };

  const handleStop = () => {
    const savedLog = stopTimer(domainId);
    if (savedLog) {
      alert(`Logged: ${savedLog.topic} for ${parseFloat((savedLog.hoursSpent).toFixed(2))} hrs!`);
      onStopSuccess?.();
    } else {
      alert('Timer stopped. Duration too short to log.');
    }
  };

  const formatTimerString = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      String(hrs).padStart(2, '0'),
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ].join(':');
  };

  if (!session) {
    return (
      <button
        type="button"
        onClick={handleStart}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
      >
        <Play size={16} /> Start Timing Session
      </button>
    );
  }

  const isPaused = session.pausedAt !== null;

  return (
    <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Pulsing indicator lights */}
          <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Timer: {isPaused ? 'Paused' : 'Running'}
          </span>
        </div>
        <span className="text-sm text-zinc-400 font-medium font-mono">
          Topic: <span className="text-zinc-200">{session.topic}</span>
        </span>
      </div>

      <div className="text-center font-mono text-3xl font-bold tracking-widest text-zinc-100 py-1">
        {formatTimerString(localElapsed)}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {isPaused ? (
          <button
            type="button"
            onClick={() => resumeTimer(domainId)}
            className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 p-2.5 rounded-lg text-xs font-bold hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Play size={12} /> Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={() => pauseTimer(domainId)}
            className="bg-amber-950/40 text-amber-400 border border-amber-900/60 p-2.5 rounded-lg text-xs font-bold hover:bg-amber-900/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Pause size={12} /> Pause
          </button>
        )}

        <button
          type="button"
          onClick={handleStop}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <Square size={12} /> Save
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to discard this timer session?')) {
              cancelTimer(domainId);
            }
          }}
          className="bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <Trash2 size={12} /> Discard
        </button>
      </div>
    </div>
  );
}

/**
 * Duplicate validation check utility
 */
function useDuplicateCheck(logs: ActivityLog[], domainId: string) {
  return (topic: string, subdomain?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const top = topic.trim().toLowerCase();
    const sub = subdomain?.trim().toLowerCase() || '';
    
    return logs.some((log) => {
      const logMidnight = new Date(log.date).toISOString().split('T')[0];
      return (
        logMidnight === todayStr &&
        log.domainId === domainId &&
        log.topic.toLowerCase() === top &&
        (log.subdomain || '').toLowerCase() === sub
      );
    });
  };
}

/**
 * Academic Studies Input Form
 */
export function AcademicStudiesInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addActivityLog } = useApp();
  const checkDuplicate = useDuplicateCheck(state.activityLogs, domainId);

  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  
  // Manual Log state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [conceptsCleared, setConceptsCleared] = useState<'Yes' | 'Partial' | 'No'>('Yes');
  const [revisionDone, setRevisionDone] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim() || !subject.trim()) {
      alert('Please fill in Topic and Subject');
      return;
    }

    if (checkDuplicate(topic, subject)) {
      if (!confirm('⚠️ Duplicate Log Warning:\nYou have already logged a session with this Subject and Topic today. Save duplicate anyway?')) {
        return;
      }
    }

    const duration = hours + (minutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    // Normalizations
    const normalizedTopic = topic.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSubject = subject.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedChapter = chapter.trim() ? chapter.trim().replace(/\b\w/g, c => c.toUpperCase()) : undefined;

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      domainId,
      domainNameSnapshot: domainName,
      topic: normalizedTopic,
      subdomain: normalizedSubject,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: notes.trim() || undefined,
      source: 'manual',
      date: new Date().setHours(0, 0, 0, 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: {
        chapter: normalizedChapter,
        conceptsCleared,
        revisionDone,
      },
    };

    addActivityLog(log);
    alert('Study session logged successfully!');
    
    // Reset Form
    setTopic('');
    setSubject('');
    setChapter('');
    setHours(1);
    setMinutes(0);
    setConceptsCleared('Yes');
    setRevisionDone(false);
    setNotes('');

    onTaskAdded?.();
  };

  const handleStopSuccess = () => {
    setTopic('');
    setSubject('');
    setChapter('');
    onTaskAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Log mode selector */}
      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'timer' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Timer Logging
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'manual' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Manual Log
        </button>
      </div>

      <div className="space-y-4">
        {/* Core fields */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Topic Studied</label>
          <input
            type="text"
            placeholder="e.g. Principal Component Analysis (PCA)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subject (Subdomain)</label>
          <input
            type="text"
            placeholder="e.g. Mathematics, Machine Learning"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Chapter / Reference (optional)</label>
          <input
            type="text"
            placeholder="e.g. Chapter 5, Section A"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        {mode === 'timer' ? (
          <TimerLoggingControl
            domainId={domainId}
            topic={topic}
            subdomain={subject}
            onStopSuccess={handleStopSuccess}
          />
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-455 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Concepts Cleared</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Yes', 'Partial', 'No'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setConceptsCleared(option)}
                    className={`p-2 rounded-lg text-xs font-semibold transition-colors border ${
                      conceptsCleared === option
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={revisionDone}
                  onChange={(e) => setRevisionDone(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-blue-600 focus:ring-0 bg-zinc-950"
                />
                <span>Revision Completed?</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
              <textarea
                placeholder="Additional notes about formulas or concepts cleared..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs resize-none placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all"
            >
              Log Study Session
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Sports Sector Input Form
 */
export function SportsInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addActivityLog } = useApp();
  const checkDuplicate = useDuplicateCheck(state.activityLogs, domainId);

  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [sportName, setSportName] = useState('');
  const [skillPracticed, setSkillPracticed] = useState('');
  
  // Manual Log state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sportName.trim() || !skillPracticed.trim()) {
      alert('Please fill in Sport Name and Skill Practiced');
      return;
    }

    if (checkDuplicate(skillPracticed, sportName)) {
      if (!confirm('⚠️ Duplicate Log Warning:\nYou have already logged a sport practice with this Skill and Sport today. Save anyway?')) {
        return;
      }
    }

    const duration = hours + (minutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    const normalizedSport = sportName.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSkill = skillPracticed.trim().replace(/\b\w/g, c => c.toUpperCase());

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      domainId,
      domainNameSnapshot: domainName,
      topic: normalizedSkill,
      subdomain: normalizedSport,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: notes.trim() || undefined,
      source: 'manual',
      date: new Date().setHours(0, 0, 0, 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: {
        skillsPracticed: [normalizedSkill],
      },
    };

    addActivityLog(log);
    alert('Sports session logged successfully!');
    
    setSportName('');
    setSkillPracticed('');
    setHours(1);
    setMinutes(0);
    setNotes('');

    onTaskAdded?.();
  };

  const handleStopSuccess = () => {
    setSportName('');
    setSkillPracticed('');
    onTaskAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Log mode selector */}
      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'timer' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Timer Logging
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'manual' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Manual Log
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Sport Name (Subdomain)</label>
          <input
            type="text"
            placeholder="e.g. Basketball, Tennis, Football"
            value={sportName}
            onChange={(e) => setSportName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Skill Practiced (Topic)</label>
          <input
            type="text"
            placeholder="e.g. Dribbling drills, Backhand smash"
            value={skillPracticed}
            onChange={(e) => setSkillPracticed(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        {mode === 'timer' ? (
          <TimerLoggingControl
            domainId={domainId}
            topic={skillPracticed}
            subdomain={sportName}
            onStopSuccess={handleStopSuccess}
          />
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-455 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
              <textarea
                placeholder="How did the session go? Record progress details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs resize-none placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all"
            >
              Log Sports Session
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Hobbies Sector Input Form
 */
export function HobbiesInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addActivityLog } = useApp();
  const checkDuplicate = useDuplicateCheck(state.activityLogs, domainId);

  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [hobbyName, setHobbyName] = useState('');
  const [activityDone, setActivityDone] = useState('');
  
  // Manual Log state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hobbyName.trim() || !activityDone.trim()) {
      alert('Please fill in Hobby Name and Activity Done');
      return;
    }

    if (checkDuplicate(activityDone, hobbyName)) {
      if (!confirm('⚠️ Duplicate Log Warning:\nYou have already logged this hobby activity today. Save anyway?')) {
        return;
      }
    }

    const duration = hours + (minutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    const normalizedHobby = hobbyName.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedActivity = activityDone.trim().replace(/\b\w/g, c => c.toUpperCase());

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      domainId,
      domainNameSnapshot: domainName,
      topic: normalizedActivity,
      subdomain: normalizedHobby,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: notes.trim() || undefined,
      source: 'manual',
      date: new Date().setHours(0, 0, 0, 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addActivityLog(log);
    alert('Hobby session logged successfully!');
    
    setHobbyName('');
    setActivityDone('');
    setHours(1);
    setMinutes(0);
    setNotes('');

    onTaskAdded?.();
  };

  const handleStopSuccess = () => {
    setHobbyName('');
    setActivityDone('');
    onTaskAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Log mode selector */}
      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'timer' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Timer Logging
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'manual' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Manual Log
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Hobby Name (Subdomain)</label>
          <input
            type="text"
            placeholder="e.g. Gaming, Reading, Chess"
            value={hobbyName}
            onChange={(e) => setHobbyName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Activity Done (Topic)</label>
          <input
            type="text"
            placeholder="e.g. Played ranked game, Read 30 pages"
            value={activityDone}
            onChange={(e) => setActivityDone(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        {mode === 'timer' ? (
          <TimerLoggingControl
            domainId={domainId}
            topic={activityDone}
            subdomain={hobbyName}
            onStopSuccess={handleStopSuccess}
          />
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-455 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Progress Notes (notes)</label>
              <textarea
                placeholder="How was your progress? Any highlights?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs resize-none placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all"
            >
              Log Hobby Activity
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Art Sector Input Form
 */
export function ArtInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addActivityLog } = useApp();
  const checkDuplicate = useDuplicateCheck(state.activityLogs, domainId);

  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [artType, setArtType] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [inspiration, setInspiration] = useState('');
  
  // Manual Log state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    if (!artType.trim() || !workDone.trim()) {
      alert('Please fill in Art Type and Practice Done');
      return;
    }

    if (checkDuplicate(workDone, artType)) {
      if (!confirm('⚠️ Duplicate Log Warning:\nYou have already logged this art activity today. Save anyway?')) {
        return;
      }
    }

    const duration = hours + (minutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    const normalizedArt = artType.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedWork = workDone.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedInspiration = inspiration.trim() ? inspiration.trim().replace(/\b\w/g, c => c.toUpperCase()) : undefined;

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      domainId,
      domainNameSnapshot: domainName,
      topic: normalizedWork,
      subdomain: normalizedArt,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: notes.trim() || undefined,
      source: 'manual',
      date: new Date().setHours(0, 0, 0, 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: {
        inspiration: normalizedInspiration,
      },
    };

    addActivityLog(log);
    alert('Art session logged successfully!');
    
    setArtType('');
    setWorkDone('');
    setInspiration('');
    setHours(1);
    setMinutes(0);
    setNotes('');

    onTaskAdded?.();
  };

  const handleStopSuccess = () => {
    setArtType('');
    setWorkDone('');
    setInspiration('');
    onTaskAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Log mode selector */}
      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'timer' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Timer Logging
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'manual' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Manual Log
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Art Type (Subdomain)</label>
          <input
            type="text"
            placeholder="e.g. Sketching, Piano, Oil Painting"
            value={artType}
            onChange={(e) => setArtType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Work / Practice Done (Topic)</label>
          <input
            type="text"
            placeholder="e.g. Shading exercises, practiced Chopin piece"
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Inspiration / Reference Used (optional)</label>
          <input
            type="text"
            placeholder="e.g. Pinterest reference photo, YouTube tutorial"
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        {mode === 'timer' ? (
          <TimerLoggingControl
            domainId={domainId}
            topic={workDone}
            subdomain={artType}
            onStopSuccess={handleStopSuccess}
          />
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-455 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
              <textarea
                placeholder="What went well? Add comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs resize-none placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all"
            >
              Log Art Session
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Fallback GenericSectorForm for custom domains
 */
export function GenericSectorForm({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addActivityLog } = useApp();
  const checkDuplicate = useDuplicateCheck(state.activityLogs, domainId);

  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [topic, setTopic] = useState('');
  const [subdomain, setSubdomain] = useState('');
  
  // Manual Log state
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('Please fill in Topic');
      return;
    }

    if (checkDuplicate(topic, subdomain)) {
      if (!confirm('⚠️ Duplicate Log Warning:\nYou have already logged this topic today. Save anyway?')) {
        return;
      }
    }

    const duration = hours + (minutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    const normalizedTopic = topic.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSubdomain = subdomain.trim()
      ? subdomain.trim().replace(/\b\w/g, c => c.toUpperCase())
      : undefined;

    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      domainId,
      domainNameSnapshot: domainName,
      topic: normalizedTopic,
      subdomain: normalizedSubdomain,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: notes.trim() || undefined,
      source: 'manual',
      date: new Date().setHours(0, 0, 0, 0),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addActivityLog(log);
    alert('Activity logged successfully!');
    
    setTopic('');
    setSubdomain('');
    setHours(1);
    setMinutes(0);
    setNotes('');

    onTaskAdded?.();
  };

  const handleStopSuccess = () => {
    setTopic('');
    setSubdomain('');
    onTaskAdded?.();
  };

  return (
    <div className="space-y-4">
      {/* Log mode selector */}
      <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode('timer')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'timer' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Timer Logging
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === 'manual' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Manual Log
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Topic / Activity</label>
          <input
            type="text"
            placeholder="e.g. Worked on project proposal, volunteering"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subdomain (optional)</label>
          <input
            type="text"
            placeholder="e.g. Documentation, Outreach"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
          />
        </div>

        {mode === 'timer' ? (
          <TimerLoggingControl
            domainId={domainId}
            topic={topic}
            subdomain={subdomain}
            onStopSuccess={handleStopSuccess}
          />
        ) : (
          <form onSubmit={handleSubmitManual} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-450 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-455 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
              <textarea
                placeholder="Additional execution details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs resize-none placeholder-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all"
            >
              Log Activity
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
