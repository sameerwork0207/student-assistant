'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/Layout';
import { OnboardingFlow } from '@/components/Onboarding';
import { Dashboard } from '@/components/Dashboard';
import { LifeActivityTracker } from '@/components/LifeActivity';
import { TaskManager } from '@/components/TaskManager';
import { HistoryView } from '@/components/HistoryView';
import { SectorSettings } from '@/components/SectorSettings';
import {
  AcademicStudiesInput,
  SportsInput,
  HobbiesInput,
  ArtInput,
  GenericSectorForm,
} from '@/components/DomainInputs';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { state, isLoading } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDomainId, setSelectedDomainId] = useState('');

  // Set default selected logging domain if domains exist
  React.useEffect(() => {
    if (state?.domains?.length > 0 && !selectedDomainId) {
      // Find first non-archived domain
      const firstActive = state.domains.find(d => !d.isArchived);
      if (firstActive) {
        setSelectedDomainId(firstActive.id);
      }
    }
  }, [state?.domains, selectedDomainId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-955 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={36} />
          <p className="text-zinc-450 font-semibold text-sm">Loading your Student Assistant...</p>
        </div>
      </div>
    );
  }

  if (!state.hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  // Filter active domains for selector
  const activeDomains = state.domains.filter((d) => !d.isArchived);

  const renderContent = () => {
    if (currentTab === 'dashboard') {
      return <Dashboard />;
    }

    if (currentTab === 'tasks') {
      return <TaskManager />;
    }

    if (currentTab === 'life-activity') {
      return <LifeActivityTracker />;
    }

    if (currentTab === 'history') {
      return <HistoryView />;
    }

    if (currentTab === 'sectors') {
      return <SectorSettings />;
    }

    if (currentTab === 'log-activity') {
      const selectedDomain = activeDomains.find((d) => d.id === selectedDomainId) || activeDomains[0];
      if (!selectedDomain) {
        return (
          <div className="text-center text-zinc-500 text-xs py-10 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md mx-auto space-y-3">
            <p>No active sectors found.</p>
            <button
              onClick={() => setCurrentTab('sectors')}
              className="bg-blue-600 hover:bg-blue-755 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Configure Sectors
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">Log Productivity Hours</h2>
            <p className="text-sm text-zinc-400">Choose an active sector and record manual logs or start a timer session</p>
          </div>

          <div className="max-w-xl mx-auto space-y-4">
            {/* Sector Selector Dropdown */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Sector to Log</label>
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                {activeDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.icon || '📌'} {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Sector forms mapping */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-2xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-xl">{selectedDomain.icon || '📌'}</span>
                  Log session for {selectedDomain.name}
                </h3>
              </div>

              {selectedDomain.id === 'academic_studies' && (
                <AcademicStudiesInput domainId={selectedDomain.id} domainName={selectedDomain.name} />
              )}
              {selectedDomain.id === 'sports' && (
                <SportsInput domainId={selectedDomain.id} domainName={selectedDomain.name} />
              )}
              {selectedDomain.id === 'hobbies' && (
                <HobbiesInput domainId={selectedDomain.id} domainName={selectedDomain.name} />
              )}
              {selectedDomain.id === 'art' && (
                <ArtInput domainId={selectedDomain.id} domainName={selectedDomain.name} />
              )}
              {/* Fallback forms for personal_studies or custom sectors */}
              {selectedDomain.id !== 'academic_studies' &&
               selectedDomain.id !== 'sports' &&
               selectedDomain.id !== 'hobbies' &&
               selectedDomain.id !== 'art' && (
                <GenericSectorForm domainId={selectedDomain.id} domainName={selectedDomain.name} />
              )}
            </div>
          </div>
        </div>
      );
    }

    return <Dashboard />;
  };

  return (
    <AppLayout activeTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}
