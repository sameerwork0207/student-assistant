'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { ActivityLog } from '@/types';
import { formatHours } from '@/lib/utils';
import { Edit3, Trash2, Calendar, Clock, BookOpen, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export function HistoryView() {
  const { state, updateActivityLog, deleteActivityLog } = useApp();
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  
  // Edit log modal state
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editHours, setEditHours] = useState(0);
  const [editMinutes, setEditMinutes] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const yesterdayMidnight = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const weekCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const monthCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return state.activityLogs.filter((log) => {
      const logMidnight = new Date(log.date).setHours(0, 0, 0, 0);
      if (timeFilter === 'today') {
        return logMidnight === todayMidnight;
      }
      if (timeFilter === 'yesterday') {
        return logMidnight === yesterdayMidnight;
      }
      if (timeFilter === 'week') {
        return log.date >= weekCutoff;
      }
      if (timeFilter === 'month') {
        return log.date >= monthCutoff;
      }
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }, [state.activityLogs, timeFilter, todayMidnight, yesterdayMidnight, weekCutoff, monthCutoff]);

  const openEditModal = (log: ActivityLog) => {
    setEditingLog(log);
    setEditTopic(log.topic);
    setEditSubdomain(log.subdomain || '');
    setEditHours(Math.floor(log.hoursSpent));
    setEditMinutes(Math.round((log.hoursSpent % 1) * 60));
    setEditNotes(log.notes || '');
  };

  const closeEditModal = () => {
    setEditingLog(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    if (!editTopic.trim()) {
      alert('Topic/Subject is required');
      return;
    }

    const duration = editHours + (editMinutes / 60);
    if (duration <= 0) {
      alert('Duration must be greater than zero');
      return;
    }

    // Normalization: trim & uppercase first letters
    const normalizedTopic = editTopic.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSubdomain = editSubdomain.trim()
      ? editSubdomain.trim().replace(/\b\w/g, c => c.toUpperCase())
      : undefined;

    updateActivityLog(editingLog.id, {
      topic: normalizedTopic,
      subdomain: normalizedSubdomain,
      hoursSpent: parseFloat(duration.toFixed(3)),
      notes: editNotes.trim() || undefined,
      updatedAt: Date.now(),
    });

    closeEditModal();
  };

  const domainMap = useMemo(() => {
    const map: Record<string, { name: string; color: string; icon?: string }> = {};
    state.domains.forEach((d) => {
      map[d.id] = { name: d.name, color: d.color, icon: d.icon };
    });
    return map;
  }, [state.domains]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Activity Log History</h2>
          <p className="text-sm text-zinc-400">Review, modify, or delete your past tracked hours.</p>
        </div>

        {/* Date Filters */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {(['today', 'yesterday', 'week', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {filteredLogs.map((log) => {
              const domain = domainMap[log.domainId] || { name: 'Custom Domain', color: '#6B7280', icon: '📌' };
              const logDate = new Date(log.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/20 transition-all">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Sector badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-zinc-700"
                        style={{ color: domain.color, backgroundColor: domain.color + '15' }}
                      >
                        <span>{domain.icon || '📌'}</span>
                        {domain.name}
                      </span>
                      
                      {/* Subdomain/Subject */}
                      {log.subdomain && (
                        <span className="text-[10px] text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md font-medium">
                          {log.subdomain}
                        </span>
                      )}

                      {/* Source badge */}
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
                        via {log.source}
                      </span>

                      {/* Migrated tag */}
                      {log.migratedLegacy && (
                        <span className="text-[9px] text-amber-500 font-semibold bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/50">
                          Legacy Migrated
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-zinc-100">{log.topic}</h3>
                    
                    {log.notes && (
                      <p className="text-xs text-zinc-400 flex items-start gap-1 font-sans">
                        <FileText size={12} className="mt-0.5 text-zinc-500 flex-shrink-0" />
                        <span>{log.notes}</span>
                      </p>
                    )}
                  </div>

                  {/* Right side: Duration + Edit/Delete */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col text-right">
                        <span className="text-base font-bold text-white flex items-center gap-1.5">
                          <Clock size={14} className="text-zinc-500" />
                          {formatHours(log.hoursSpent)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {logDate}
                        </span>
                      </div>
                    </div>

                    {/* Edit/Delete actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(log)}
                        className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-all"
                        title="Edit Log"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteActivityLog(log.id)}
                        className="p-2 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 rounded-lg text-zinc-400 hover:text-red-400 transition-all"
                        title="Delete Log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 space-y-2">
            <AlertCircle className="mx-auto text-zinc-600" size={32} />
            <p className="font-semibold text-zinc-400">No activity logs found</p>
            <p className="text-xs">No hours recorded for the selected timeframe.</p>
          </div>
        )}
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Modify Activity Log</h3>
              <p className="text-xs text-zinc-400">Edit values for this execution log</p>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Topic / Topic Studied</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. PCA, Practice dribbling"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Subdomain (optional)</label>
                <input
                  type="text"
                  value={editSubdomain}
                  onChange={(e) => setEditSubdomain(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Mathematics, Basketball"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={editHours}
                    onChange={(e) => setEditHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder="Notes about this log session..."
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2.5 rounded-xl text-sm font-semibold transition-all border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
