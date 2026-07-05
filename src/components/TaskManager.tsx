'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Task, ActivityLog } from '@/types';
import { Plus, CheckSquare, Square, Trash2, Calendar, Layers, Clock, Check, CheckCircle } from 'lucide-react';


export function TaskManager() {
  const { state, addTask, toggleTaskCompletion, deleteTask, startTimer } = useApp();
  
  // Creation modes
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  
  // Single task form state
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(0);
  const [logNotes, setLogNotes] = useState('');

  // Batch task form state
  const [batchTitleText, setBatchTitleText] = useState('');
  const [batchDomainId, setBatchDomainId] = useState('');

  // Task Completion Modal state
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [completionMode, setCompletionMode] = useState<'none' | 'manual' | 'timer'>('none');
  const [compHours, setCompHours] = useState(1);
  const [compMinutes, setCompMinutes] = useState(0);
  const [compNotes, setCompNotes] = useState('');

  // Set default domainId if domains exist
  React.useEffect(() => {
    if (state.domains.length > 0) {
      if (!domainId) setDomainId(state.domains[0].id);
      if (!batchDomainId) setBatchDomainId(state.domains[0].id);
    }
  }, [state.domains, domainId, batchDomainId]);

  const domainMap = useMemo(() => {
    const map: Record<string, { name: string; color: string; icon?: string }> = {};
    state.domains.forEach((d) => {
      map[d.id] = { name: d.name, color: d.color, icon: d.icon };
    });
    return map;
  }, [state.domains]);

  // Tasks Lists
  const pendingTasks = useMemo(() => {
    return state.tasks.filter((t) => t.status === 'pending').sort((a, b) => b.createdAt - a.createdAt);
  }, [state.tasks]);

  const completedTasks = useMemo(() => {
    return state.tasks.filter((t) => t.status === 'completed').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [state.tasks]);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !domainId) {
      alert('Please enter a task title and select a sector');
      return;
    }

    const tId = Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    // Normalize subdomain and title
    const normalizedTitle = title.trim().replace(/\b\w/g, c => c.toUpperCase());
    const normalizedSubdomain = subdomain.trim()
      ? subdomain.trim().replace(/\b\w/g, c => c.toUpperCase())
      : undefined;

    const task: Task = {
      id: tId,
      title: normalizedTitle,
      domainId,
      subdomain: normalizedSubdomain,
      status: alreadyCompleted ? 'completed' : 'pending',
      createdAt: now,
      completedAt: alreadyCompleted ? now : undefined,
    };

    addTask(task);

    // If already completed and time spent added, log to ActivityLog
    const duration = logHours + (logMinutes / 60);
    if (alreadyCompleted && duration > 0) {
      const logId = Math.random().toString(36).substring(2, 9);
      const newLog: ActivityLog = {
        id: logId,
        domainId,
        topic: normalizedTitle,
        subdomain: normalizedSubdomain,
        hoursSpent: parseFloat(duration.toFixed(3)),
        notes: logNotes.trim() || undefined,
        source: 'task',
        date: new Date().setHours(0, 0, 0, 0),
        createdAt: now,
        updatedAt: now,
        linkedTaskId: tId,
      };
      
      // We toggle complete with logged parameters
      toggleTaskCompletion(tId, parseFloat(duration.toFixed(3)), logNotes.trim());
    }

    // Reset Form
    setTitle('');
    setSubdomain('');
    setAlreadyCompleted(false);
    setLogHours(0);
    setLogMinutes(0);
    setLogNotes('');
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTitleText.trim() || !batchDomainId) {
      alert('Please enter task titles and select a sector');
      return;
    }

    const lines = batchTitleText.split('\n').map((l) => l.trim()).filter((l) => l);
    const now = Date.now();

    lines.forEach((line) => {
      const tId = Math.random().toString(36).substring(2, 9);
      const normalizedTitle = line.replace(/\b\w/g, c => c.toUpperCase());
      
      addTask({
        id: tId,
        title: normalizedTitle,
        domainId: batchDomainId,
        status: 'pending',
        createdAt: now,
      });
    });

    setBatchTitleText('');
    alert(`Successfully added ${lines.length} tasks!`);
  };

  const handleCheckboxClick = (task: Task) => {
    if (task.status === 'completed') {
      // Uncompleting - simple toggle back (AppContext handles unlinking/removing linked log if any)
      toggleTaskCompletion(task.id);
    } else {
      // Completing - open completion option dialog
      setCompletingTask(task);
      setCompletionMode('none');
      setCompHours(1);
      setCompMinutes(0);
      setCompNotes('');
    }
  };

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    if (completionMode === 'manual') {
      const duration = compHours + (compMinutes / 60);
      toggleTaskCompletion(completingTask.id, parseFloat(duration.toFixed(3)), compNotes.trim());
    } else if (completionMode === 'timer') {
      // Start active timer linked to this task
      startTimer(completingTask.domainId, completingTask.title, completingTask.subdomain, completingTask.id);
      alert(`Timer started for task "${completingTask.title}"! Toggle to 'Log Activity' or 'Dashboard' to view.`);
    } else {
      // Complete with 0 logged hours
      toggleTaskCompletion(completingTask.id);
    }

    setCompletingTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Task Intentions Manager</h2>
        <p className="text-sm text-zinc-400">Add tasks now and capture your actual execution times later.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-fit space-y-4">
          <div className="flex border-b border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'single' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400'
              }`}
            >
              Single Task
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'batch' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400'
              }`}
            >
              Batch Tasks
            </button>
          </div>

          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Read Chapter 4, Code UI elements"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Sector</label>
                  <select
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    {state.domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.icon || '📌'} {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Subdomain</label>
                  <input
                    type="text"
                    placeholder="e.g. Science, UI"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
                  />
                </div>
              </div>

              {/* Already Completed Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={alreadyCompleted}
                    onChange={(e) => setAlreadyCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 text-blue-600 focus:ring-0 bg-zinc-950"
                  />
                  <span>Already Completed?</span>
                </label>
              </div>

              {/* Log Duration subform */}
              {alreadyCompleted && (
                <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl space-y-3 animate-fade-in">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Execution duration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={logHours}
                        onChange={(e) => setLogHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={logMinutes}
                        onChange={(e) => setLogMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-2"
              >
                Add Intention
              </button>
            </form>
          ) : (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Sector</label>
                <select
                  value={batchDomainId}
                  onChange={(e) => setBatchDomainId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  {state.domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon || '📌'} {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Titles (One per line)</label>
                <textarea
                  placeholder="Task 1&#10;Task 2&#10;Task 3"
                  value={batchTitleText}
                  onChange={(e) => setBatchTitleText(e.target.value)}
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none font-mono placeholder-zinc-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-2"
              >
                Add Batch Intentions
              </button>
            </form>
          )}
        </div>

        {/* Task lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending tasks */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              Pending Intentions ({pendingTasks.length})
            </h3>
            
            {pendingTasks.length > 0 ? (
              <div className="grid gap-2.5">
                {pendingTasks.map((task) => {
                  const domain = domainMap[task.domainId] || { name: 'Sector', color: '#6B7280', icon: '📌' };
                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCheckboxClick(task)}
                          className="text-zinc-600 hover:text-zinc-200 transition-colors"
                        >
                          <Square size={20} />
                        </button>
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: domain.color, backgroundColor: domain.color + '15' }}
                            >
                              {domain.name}
                            </span>
                            {task.subdomain && (
                              <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-medium">
                                {task.subdomain}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-500 hover:text-red-400 p-2 hover:bg-zinc-900/50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-4">No pending intentions. Add some to start planning!</p>
            )}
          </div>

          {/* Completed tasks */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              Completed Tasks ({completedTasks.length})
            </h3>

            {completedTasks.length > 0 ? (
              <div className="grid gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {completedTasks.map((task) => {
                  const domain = domainMap[task.domainId] || { name: 'Sector', color: '#6B7280', icon: '📌' };
                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950 border border-zinc-850 p-3 py-2.5 rounded-xl flex items-center justify-between gap-3 opacity-65 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCheckboxClick(task)}
                          className="text-green-500 hover:text-zinc-400 transition-colors"
                        >
                          <CheckSquare size={20} />
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-zinc-400 line-through">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: domain.color, backgroundColor: domain.color + '15' }}
                            >
                              {domain.name}
                            </span>
                            {task.subdomain && (
                              <span className="text-[9px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded font-medium">
                                {task.subdomain}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-600 hover:text-red-400 p-2 hover:bg-zinc-900/50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-4">No completed tasks yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Task Completion Flow modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Check size={20} className="text-green-500" />
                Complete Task
              </h3>
              <p className="text-xs text-zinc-400">"{completingTask.title}"</p>
            </div>

            <form onSubmit={handleCompletionSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">How would you like to log this execution?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletionMode('none')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      completionMode === 'none'
                        ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>🎯</span> Check off only
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletionMode('manual')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      completionMode === 'manual'
                        ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>✍️</span> Log Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletionMode('timer')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      completionMode === 'timer'
                        ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>⏱️</span> Start Timer
                  </button>
                </div>
              </div>

              {completionMode === 'manual' && (
                <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={compHours}
                        onChange={(e) => setCompHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={compMinutes}
                        onChange={(e) => setCompMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Notes</label>
                    <textarea
                      placeholder="What did you work on?"
                      value={compNotes}
                      onChange={(e) => setCompNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {completionMode === 'timer' && (
                <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-850 leading-relaxed">
                  💡 This will automatically start a running timer in the background linked to this task. Upon stopping it, the task will mark as completed and the logged duration will write directly to the execution history.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 p-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
