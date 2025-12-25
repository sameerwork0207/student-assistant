'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/Layout';
import { OnboardingFlow } from '@/components/Onboarding';
import { Dashboard } from '@/components/Dashboard';
import { LifeActivityTracker } from '@/components/LifeActivity';
import {
  AcademicStudiesInput,
  SportsArtInput,
  PersonalStudiesInput,
} from '@/components/DomainInputs';

export default function Home() {
  const { state, isLoading } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your assistant...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!state.hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  // Render content based on current tab
  const renderContent = () => {
    if (currentTab === 'dashboard') {
      return <Dashboard />;
    }

    if (currentTab === 'life-activity') {
      return <LifeActivityTracker />;
    }

    // Find matching domain
    const domain = state.domains.find((d) => d.id === currentTab);
    if (!domain) {
      return <Dashboard />;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{domain.name}</h1>
          <p className="text-gray-600 mt-1">
            {domain.description || `Track your progress in ${domain.name}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Log Activity</h2>
            {currentTab === 'academic_studies' && (
              <AcademicStudiesInput
                domainId={domain.id}
                domainName={domain.name}
              />
            )}
            {currentTab === 'sports_hobbies_art' && (
              <SportsArtInput
                domainId={domain.id}
                domainName={domain.name}
              />
            )}
            {currentTab === 'personal_studies' && (
              <PersonalStudiesInput
                domainId={domain.id}
                domainName={domain.name}
              />
            )}
            {domain.isCustom && (
              <PersonalStudiesInput
                domainId={domain.id}
                domainName={domain.name}
              />
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            {state.tasks
              .filter((t) => t.domainId === domain.id)
              .slice(-5)
              .reverse()
              .map((task) => (
                <div key={task.id} className="mb-3 pb-3 border-b last:border-b-0">
                  <p className="text-sm font-semibold text-gray-700">
                    {(task.data as any).subject ||
                      (task.data as any).subDomain ||
                      'Activity'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(task.data.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            {state.tasks.filter((t) => t.domainId === domain.id).length === 0 && (
              <p className="text-gray-500 text-sm">No activities logged yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout activeTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}
