'use client';

import React, { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function AppLayout({ children, activeTab = 'dashboard', onTabChange }: LayoutProps) {
  const { state, undoMessage, triggerUndo, clearUndo, clearAllData } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = useCallback((tabId: string) => {
    onTabChange?.(tabId);
    setMobileMenuOpen(false);
  }, [onTabChange]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'log-activity', label: 'Log Activity', icon: '📝' },
    { id: 'tasks', label: 'Tasks', icon: '🎯' },
    { id: 'life-activity', label: 'Life Activity', icon: '⏱️' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⚡</span>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Student Assistant
              </h1>
              {state.user && (
                <span className="text-[10px] text-zinc-400 font-medium">
                  {state.user.name} | {state.user.educationDetails.level.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear All Data Button */}
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure you want to clear all data and settings? This cannot be undone.')) {
                  clearAllData();
                  window.location.reload();
                }
              }}
              className="hidden md:block px-3 py-1.5 text-xs text-red-400 border border-red-900/50 hover:bg-red-950/40 rounded-lg transition-colors font-medium"
            >
              Reset App
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-t border-zinc-800 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <hr className="border-zinc-800 my-2" />
              <button
                onClick={() => {
                  if (confirm('Clear all data?')) {
                    clearAllData();
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/20 text-sm font-semibold rounded-lg"
              >
                <span>⚠️</span> Reset App Data
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 p-4 space-y-6">
          <nav className="flex-1 space-y-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                  activeTab === tab.id
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-transparent'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-[10px] text-zinc-500 font-mono text-center">
              Student Assistant v2.0
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden bg-zinc-950 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Undo/Soft-delete Toast notification */}
      {undoMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up max-w-sm">
          <span className="text-sm font-medium">{undoMessage}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerUndo}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Undo
            </button>
            <button
              onClick={clearUndo}
              className="text-zinc-400 hover:text-zinc-100 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
