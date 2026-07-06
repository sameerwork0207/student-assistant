'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Clock, Moon, CheckSquare, BarChart3, History, Menu, X, Timer } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
  const { state, undoMessage, triggerUndo, clearUndo, addTask, startTimer, saveLifeActivity } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global mobile action overlay triggers
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isStartTimerOpen, setIsStartTimerOpen] = useState(false);
  const [isLogLifeOpen, setIsLogLifeOpen] = useState(false);

  // Mobile Add Task Form State (bound to shared draft key)
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSector, setTaskSector] = useState('');
  const [taskSubdomain, setTaskSubdomain] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  // Mobile Start Timer Form State
  const [timerSector, setTimerSector] = useState('');
  const [timerTopic, setTimerTopic] = useState('');
  const [timerSubdomain, setTimerSubdomain] = useState('');

  // Mobile Log Life Form State
  const [lifeSleep, setLifeSleep] = useState(7);
  const [lifeCommute, setLifeCommute] = useState(1);
  const [lifeMeals, setLifeMeals] = useState(1);
  const [lifeScroll, setLifeScroll] = useState(2);
  const [lifeSocial, setLifeSocial] = useState(1);

  // Filter archived sectors for mobile selectors
  const activeSectors = React.useMemo(() => {
    return state.domains.filter((d) => !d.isArchived);
  }, [state.domains]);

  // Set default sectors on mount/change
  useEffect(() => {
    if (activeSectors.length > 0) {
      Promise.resolve().then(() => {
        if (!taskSector) setTaskSector(activeSectors[0].id);
        if (!timerSector) setTimerSector(activeSectors[0].id);
      });
    }
  }, [activeSectors, taskSector, timerSector]);

  // Sync mobile Add Task modal state with the shared localStorage draft
  useEffect(() => {
    if (isAddTaskOpen) {
      const cached = localStorage.getItem('student-assistant-task-draft');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          Promise.resolve().then(() => {
            if (parsed.title) setTaskTitle(parsed.title);
            if (parsed.domainId) setTaskSector(parsed.domainId);
            if (parsed.subdomain) setTaskSubdomain(parsed.subdomain);
            if (parsed.description) setTaskDesc(parsed.description);
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [isAddTaskOpen]);

  // Write changes inside the mobile modal to the shared draft storage key
  useEffect(() => {
    if (isAddTaskOpen) {
      if (!taskTitle.trim() && !taskDesc.trim()) {
        localStorage.removeItem('student-assistant-task-draft');
        return;
      }
      const draft = {
        title: taskTitle,
        domainId: taskSector,
        subdomain: taskSubdomain,
        description: taskDesc,
        checklist: [],
        links: [],
        imagesList: [],
      };
      localStorage.setItem('student-assistant-task-draft', JSON.stringify(draft));
    }
  }, [taskTitle, taskSector, taskSubdomain, taskDesc, isAddTaskOpen]);

  const handleMobileAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskSector) {
      alert('Task title and sector are required.');
      return;
    }
    addTask({
      id: Math.random().toString(36).substring(2, 9),
      title: taskTitle.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
      domainId: taskSector,
      subdomain: taskSubdomain.trim() ? taskSubdomain.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : undefined,
      description: taskDesc.trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
    });
    setTaskTitle('');
    setTaskSubdomain('');
    setTaskDesc('');
    setIsAddTaskOpen(false);
    alert('Task intention created successfully!');
  };

  const handleMobileStartTimerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timerTopic.trim() || !timerSector) {
      alert('Timer topic and sector are required.');
      return;
    }
    startTimer(timerSector, timerTopic.trim(), timerSubdomain.trim() || undefined);
    setTimerTopic('');
    setTimerSubdomain('');
    setIsStartTimerOpen(false);
    alert('Timer started in the background!');
  };

  const handleMobileLogLifeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    saveLifeActivity({
      date: todayMidnight,
      sleep: Number(lifeSleep),
      travel: Number(lifeCommute),
      meals: Number(lifeMeals),
      scrollIdle: Number(lifeScroll),
      socialize: Number(lifeSocial),
      custom: {},
    });
    setIsLogLifeOpen(false);
    alert('Life activities updated!');
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'log-activity', label: 'Log Activity', icon: Clock },
    { id: 'tasks', label: 'Tasks Intentions', icon: CheckSquare },
    { id: 'life-activity', label: 'Life Routine', icon: Moon },
    { id: 'history', label: 'History View', icon: History },
    { id: 'sectors', label: 'Sectors Settings', icon: Plus }, // Settings page linked
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row relative pb-16 md:pb-0">
      
      {/* Header bar for Mobile viewports */}
      <header className="md:hidden bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-35">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <h1 className="text-sm font-bold text-white tracking-wider uppercase">Student Assistant</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-zinc-400 hover:text-white p-1"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Navigation Sidebar */}
      <aside
        className={`bg-zinc-900 border-r border-zinc-850 w-full md:w-64 flex flex-col fixed md:sticky top-[53px] md:top-0 h-[calc(100vh-53px)] md:h-screen z-40 transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-5 border-b border-zinc-850">
          <span className="text-2xl">🎓</span>
          <h1 className="text-base font-extrabold text-white tracking-wider uppercase">Student Assistant</h1>
        </div>

        {/* User Card */}
        {state.user && (
          <div className="px-6 py-4 border-b border-zinc-850 bg-zinc-950/20">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Logged user</span>
            <span className="text-sm font-bold text-zinc-200 mt-1 block truncate">{state.user.name}</span>
          </div>
        )}

        {/* Sidebar Tabs */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-850/40'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* Floating Soft-Delete / Undo Toast */}
      {undoMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-80 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3 shadow-2xl z-50 animate-slide-in">
          <span className="text-xs text-zinc-200 font-semibold">{undoMessage}</span>
          <div className="flex gap-2">
            <button
              onClick={triggerUndo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
            >
              Undo
            </button>
            <button
              onClick={clearUndo}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM MOBILE QUICK ACTION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 h-16 px-4 py-2 flex items-center justify-around z-35">
        <button
          onClick={() => setIsAddTaskOpen(true)}
          className="flex flex-col items-center gap-0.5 text-zinc-450 hover:text-white"
        >
          <Plus size={18} />
          <span className="text-[8px] font-bold uppercase tracking-wide">Add Task</span>
        </button>
        <button
          onClick={() => setIsStartTimerOpen(true)}
          className="flex flex-col items-center gap-0.5 text-zinc-450 hover:text-white"
        >
          <Timer size={18} />
          <span className="text-[8px] font-bold uppercase tracking-wide">Start Timer</span>
        </button>
        <button
          onClick={() => setIsLogLifeOpen(true)}
          className="flex flex-col items-center gap-0.5 text-zinc-450 hover:text-white"
        >
          <Moon size={18} />
          <span className="text-[8px] font-bold uppercase tracking-wide">Log Routine</span>
        </button>
      </div>

      {/* 1. Quick Add Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-bold text-white">Quick Add Intention</h3>
              <button onClick={() => setIsAddTaskOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleMobileAddTaskSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Study Physics, Write code"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Sector</label>
                  <select
                    value={taskSector}
                    onChange={(e) => setTaskSector(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  >
                    {activeSectors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.icon || '📌'} {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Subdomain</label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 1"
                    value={taskSubdomain}
                    onChange={(e) => setTaskSubdomain(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Long Description</label>
                <textarea
                  placeholder="Task details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTaskTitle('');
                    setTaskSubdomain('');
                    setTaskDesc('');
                    localStorage.removeItem('student-assistant-task-draft');
                    setIsAddTaskOpen(false);
                  }}
                  className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 py-2 rounded-lg text-xs font-semibold"
                >
                  Clear Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Quick Start Timer Modal */}
      {isStartTimerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-bold text-white">Quick Start Timer</h3>
              <button onClick={() => setIsStartTimerOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleMobileStartTimerSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Sector</label>
                <select
                  value={timerSector}
                  onChange={(e) => setTimerSector(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                >
                  {activeSectors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon || '📌'} {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. Solved equations, Drawing sketches"
                  value={timerTopic}
                  onChange={(e) => setTimerTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Subdomain</label>
                <input
                  type="text"
                  placeholder="e.g. Maths, Practice"
                  value={timerSubdomain}
                  onChange={(e) => setTimerSubdomain(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-bold mt-2"
              >
                Start Timer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Quick Log Life Activity Modal */}
      {isLogLifeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-bold text-white">Log Routine Hours</h3>
              <button onClick={() => setIsLogLifeOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleMobileLogLifeSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Sleep (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lifeSleep}
                    onChange={(e) => setLifeSleep(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Commute (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lifeCommute}
                    onChange={(e) => setLifeCommute(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Meals (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lifeMeals}
                    onChange={(e) => setLifeMeals(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Idle Scroll (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={lifeScroll}
                    onChange={(e) => setLifeScroll(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-450 mb-1">Socialize (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={lifeSocial}
                  onChange={(e) => setLifeSocial(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-bold mt-2"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
