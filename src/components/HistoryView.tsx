'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ActivityLog, Task } from '@/types';
import { Trash2, Edit2, CheckCircle2, Clock, Calendar, CheckSquare, AlertCircle } from 'lucide-react';

export function HistoryView() {
  const { state, updateActivityLog, deleteActivityLog } = useApp();
  const [filterRange, setFilterRange] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');

  // Inline editing state for Activity Logs
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  // Date ranges boundaries (midnight timestamps)
  const dateBoundaries = useMemo(() => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const yesterdayMid = todayMid - 24 * 60 * 60 * 1000;
    
    // Start of current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
    
    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      today: todayMid,
      yesterday: yesterdayMid,
      week: startOfWeek,
      month: startOfMonth,
    };
  }, []);

  // Expose active domain color mapping
  const domainColors = useMemo(() => {
    const map: Record<string, string> = {};
    state.domains.forEach((d) => {
      map[d.id] = d.color;
    });
    return map;
  }, [state.domains]);

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return state.activityLogs
      .filter((log) => {
        const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
        if (filterRange === 'today') {
          return logMidnight === dateBoundaries.today;
        }
        if (filterRange === 'yesterday') {
          return logMidnight === dateBoundaries.yesterday;
        }
        if (filterRange === 'week') {
          return log.date >= dateBoundaries.week;
        }
        if (filterRange === 'month') {
          return log.date >= dateBoundaries.month;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [state.activityLogs, filterRange, dateBoundaries]);

  // Filtered Completed Tasks
  const filteredCompletedTasks = useMemo(() => {
    return state.tasks
      .filter((task) => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        const taskMidnight = new Date(task.completedAt).setHours(0, 0, 0, 0);

        if (filterRange === 'today') {
          return taskMidnight === dateBoundaries.today;
        }
        if (filterRange === 'yesterday') {
          return taskMidnight === dateBoundaries.yesterday;
        }
        if (filterRange === 'week') {
          return task.completedAt >= dateBoundaries.week;
        }
        if (filterRange === 'month') {
          return task.completedAt >= dateBoundaries.month;
        }
        return true;
      })
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [state.tasks, filterRange, dateBoundaries]);

  // Inline editing actions
  const startEditLog = (log: ActivityLog) => {
    setEditingLogId(log.id);
    setEditTopic(log.topic);
    setEditSubdomain(log.subdomain || '');
    setEditHours(Math.floor(log.hoursSpent));
    setEditMinutes(Math.round((log.hoursSpent % 1) * 60));
    setEditNotes(log.notes || '');
  };

  const saveEditLog = (id: string) => {
    if (!editTopic.trim()) {
      alert('Topic description cannot be empty');
      return;
    }
    const duration = editHours + (editMinutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    updateActivityLog(id, {
      topic: editTopic.trim(),
      subdomain: editSubdomain.trim() || undefined,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: editNotes.trim() || undefined,
    });

    setEditingLogId(null);
  };

  // Group by formatted dates helper
  const groupedItems = useMemo(() => {
    const groups: Record<string, { logs: ActivityLog[]; tasks: Task[] }> = {};

    filteredLogs.forEach((log) => {
      const dateStr = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = { logs: [], tasks: [] };
      groups[dateStr].logs.push(log);
    });

    filteredCompletedTasks.forEach((task) => {
      const dateStr = new Date(task.completedAt || 0).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = { logs: [], tasks: [] };
      groups[dateStr].tasks.push(task);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredLogs, filteredCompletedTasks]);

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">History & Reflection</h2>
          <p className="text-sm text-zinc-400">Reflect on daily routine activities and completed intentions.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl w-fit">
          {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setFilterRange(range)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filterRange === range
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline lists */}
      {groupedItems.length > 0 ? (
        <div className="space-y-6">
          {groupedItems.map(([dateString, group]) => (
            <div key={dateString} className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Date Header */}
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-850 flex items-center gap-2">
                <Calendar size={15} className="text-blue-500" />
                <span className="text-xs font-bold text-zinc-300">{dateString}</span>
              </div>

              <div className="p-4 space-y-4">
                
                {/* 1. Logged Productive Hours Section */}
                {group.logs.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-850 pb-1">
                      <Clock size={11} className="text-blue-500" /> Monitored Hours spent
                    </h4>
                    
                    <div className="grid gap-2.5">
                      {group.logs.map((log) => {
                        const color = domainColors[log.domainId] || '#6B7280';
                        const isEditing = editingLogId === log.id;

                        return (
                          <div
                            key={log.id}
                            className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            {isEditing ? (
                              // Edit Form Mode
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Topic</label>
                                  <input
                                    type="text"
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-850 text-white text-xs px-2.5 py-1.5 rounded-lg w-full"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Subdomain</label>
                                  <input
                                    type="text"
                                    value={editSubdomain}
                                    onChange={(e) => setEditSubdomain(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-850 text-white text-xs px-2.5 py-1.5 rounded-lg w-full"
                                  />
                                </div>
                                <div className="space-y-1 grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-zinc-550 font-bold uppercase">Hours</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={editHours}
                                      onChange={(e) => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="bg-zinc-900 border border-zinc-850 text-white text-xs px-2 py-1.5 rounded-lg w-full text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-zinc-550 font-bold uppercase">Mins</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="59"
                                      value={editMinutes}
                                      onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                      className="bg-zinc-900 border border-zinc-850 text-white text-xs px-2 py-1.5 rounded-lg w-full text-center"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-zinc-550 font-bold uppercase">Notes</label>
                                  <input
                                    type="text"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-850 text-white text-xs px-2.5 py-1.5 rounded-lg w-full"
                                  />
                                </div>
                              </div>
                            ) : (
                              // Standard View Mode
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-100">{log.topic}</span>
                                  <span className="text-[9px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                    {log.source}
                                  </span>
                                  {log.migratedLegacy && (
                                    <span className="text-[9px] text-amber-500 bg-amber-950/20 px-1.5 py-0.5 rounded font-bold">
                                      Migrated
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-450 font-semibold">
                                  <span
                                    className="px-1.5 py-0.5 rounded font-bold"
                                    style={{ color: color, backgroundColor: color + '15' }}
                                  >
                                    {log.domainNameSnapshot}
                                  </span>
                                  {log.subdomain && (
                                    <span className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                                      {log.subdomain}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-zinc-350">
                                    ⏱️ {log.hoursSpent.toFixed(1)} hrs
                                  </span>
                                  {log.createdAt && (
                                    <span className="font-mono text-zinc-500 font-medium">
                                      {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                {log.notes && (
                                  <p className="text-xs text-zinc-400 mt-1 pl-2.5 border-l-2 border-zinc-800 leading-relaxed font-sans">
                                    {log.notes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 self-end md:self-center">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEditLog(log.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingLogId(null)}
                                    className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditLog(log)}
                                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg"
                                    title="Edit Log"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteActivityLog(log.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg"
                                    title="Delete Log"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Completed Tasks Section */}
                {group.tasks.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5 border-b border-zinc-850 pb-1">
                      <CheckCircle2 size={11} className="text-green-500" /> Completed Intentions
                    </h4>

                    <div className="grid gap-2.5">
                      {group.tasks.map((task) => {
                        const color = domainColors[task.domainId] || '#6B7280';
                        return (
                          <div
                            key={task.id}
                            className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-start justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-zinc-300 line-through leading-tight">{task.title}</span>
                                <span className="text-[9px] text-green-500 bg-green-950/15 border border-green-900/20 px-1.5 py-0.5 rounded font-bold">
                                  Done
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-bold">
                                <span
                                  className="px-1.5 py-0.5 rounded"
                                  style={{ color: color, backgroundColor: color + '15' }}
                                >
                                  {task.domainNameSnapshot}
                                </span>
                                {task.subdomain && (
                                  <span className="bg-zinc-900 px-1.5 py-0.5 rounded font-medium">
                                    {task.subdomain}
                                  </span>
                                )}
                                {task.completedAt && (
                                  <span className="font-mono font-medium">
                                    Completed {new Date(task.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-xs text-zinc-450 pl-2.5 border-l-2 border-zinc-850 leading-relaxed font-sans">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Visual completion icon */}
                            <CheckSquare size={16} className="text-green-500 mt-1 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center space-y-2">
          <AlertCircle className="mx-auto text-zinc-500" size={32} />
          <h4 className="text-sm font-bold text-white">No historical logs found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You haven&apos;t recorded any sessions or completed any tasks within the selected range ({filterRange}).
          </p>
        </div>
      )}
    </div>
  );
}
