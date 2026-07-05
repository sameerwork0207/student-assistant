'use client';

import React, { useState } from 'react';
import { EducationLevel, UserProfile, EducationDetails, SchoolDetails, JuniorCollegeDetails, DegreeCollegeDetails } from '@/types';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';

interface EducationStepProps {
  onNext: (level: EducationLevel) => void;
}

export function EducationLevelStep({ onNext }: EducationStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">What is your education level?</h2>
      <p className="text-sm text-zinc-400 text-center">This helps us personalize your tracking experience</p>

      <div className="grid gap-3 pt-2">
        {[
          { level: EducationLevel.SCHOOL, label: 'School / K-12', icon: '🎒' },
          { level: EducationLevel.JUNIOR_COLLEGE, label: 'Junior College / Prep', icon: '📚' },
          { level: EducationLevel.DEGREE_COLLEGE, label: 'Degree College / University', icon: '🎓' },
        ].map(({ level, label, icon }) => (
          <button
            key={level}
            onClick={() => onNext(level)}
            className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500 hover:bg-zinc-800/50 transition-all text-left group"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">{icon}</span>
            <span className="text-base font-semibold text-zinc-200 group-hover:text-white">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface EducationDetailsStepProps {
  level: EducationLevel;
  onNext: (details: EducationDetails) => void;
  onBack: () => void;
}

export function EducationDetailsStep({ level, onNext, onBack }: EducationDetailsStepProps) {
  const [classGrade, setClassGrade] = useState('');
  const [stream, setStream] = useState<'Science' | 'Commerce' | 'Arts'>('Science');
  const [degree, setDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [year, setYear] = useState<1 | 2 | 3 | 4>(1);

  const handleSubmit = () => {
    let details: EducationDetails;

    if (level === EducationLevel.SCHOOL) {
      if (!classGrade.trim()) {
        alert('Please enter your class/grade');
        return;
      }
      details = { level, classGrade } as SchoolDetails;
    } else if (level === EducationLevel.JUNIOR_COLLEGE) {
      details = { level, stream } as JuniorCollegeDetails;
    } else {
      if (!degree.trim()) {
        alert('Please enter your degree name');
        return;
      }
      details = { level, degree, specialization, year } as DegreeCollegeDetails;
    }

    onNext(details);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
        ← Back
      </button>

      {level === EducationLevel.SCHOOL && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">What is your class / grade?</h2>
          <input
            type="text"
            placeholder="e.g., 10th Grade, Class 11"
            value={classGrade}
            onChange={(e) => setClassGrade(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
          />
        </div>
      )}

      {level === EducationLevel.JUNIOR_COLLEGE && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">What stream are you in?</h2>
          <div className="grid gap-2">
            {(['Science', 'Commerce', 'Arts'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStream(s)}
                className={`p-3 text-left font-semibold rounded-xl border transition-all ${
                  stream === s
                    ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {s} Stream
              </button>
            ))}
          </div>
        </div>
      )}

      {level === EducationLevel.DEGREE_COLLEGE && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Tell us about your university studies</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Degree (e.g., Engineering, BCA, Business)"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
            />
            <input
              type="text"
              placeholder="Specialization (optional, e.g., Computer Science)"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600"
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Current Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-4"
      >
        Next Step
      </button>
    </div>
  );
}

interface DomainSelectionStepProps {
  onNext: (domains: { id: string; label: string; icon: string; selected: boolean }[], customDomains: string[]) => void;
  onBack: () => void;
}

export function DomainSelectionStep({ onNext, onBack }: DomainSelectionStepProps) {
  const [defaultDomains, setDefaultDomains] = useState([
    { id: 'academic_studies', label: 'Academic Studies', icon: '🎓', selected: true },
    { id: 'personal_studies', label: 'Personal Studies', icon: '📚', selected: true },
    { id: 'sports', label: 'Sports Practice', icon: '⚽', selected: true },
    { id: 'hobbies', label: 'Hobbies', icon: '🎮', selected: true },
    { id: 'art', label: 'Art / Creativity', icon: '🎨', selected: true },
  ]);

  const [customDomain, setCustomDomain] = useState('');
  const [customDomains, setCustomDomains] = useState<string[]>([]);

  const toggleDomain = (id: string) => {
    setDefaultDomains(
      defaultDomains.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const addCustomDomain = () => {
    if (customDomain.trim() && !customDomains.includes(customDomain.trim())) {
      setCustomDomains([...customDomains, customDomain.trim()]);
      setCustomDomain('');
    }
  };

  const removeCustomDomain = (domain: string) => {
    setCustomDomains(customDomains.filter((d) => d !== domain));
  };

  const handleNext = () => {
    const selectedDefaults = defaultDomains.filter((d) => d.selected);
    if (selectedDefaults.length === 0 && customDomains.length === 0) {
      alert('Please select or add at least one tracking domain');
      return;
    }
    onNext(defaultDomains, customDomains);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
        ← Back
      </button>

      <h2 className="text-xl font-bold text-white">What sectors do you want to track?</h2>
      <p className="text-xs text-zinc-400">Deselect default domains or create custom ones. You can always edit them later.</p>

      <div className="space-y-2 pt-2">
        {defaultDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => toggleDomain(domain.id)}
            className={`w-full flex items-center justify-between p-3.5 border rounded-xl transition-all ${
              domain.selected
                ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{domain.icon}</span>
              <span className="font-semibold text-sm">{domain.label}</span>
            </div>
            <span className="text-xs font-semibold">{domain.selected ? '✓ Active' : '✕ Disabled'}</span>
          </button>
        ))}
      </div>

      {customDomains.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="font-semibold text-xs text-zinc-400">Custom Sectors</p>
          <div className="flex flex-wrap gap-2">
            {customDomains.map((domain) => (
              <span
                key={domain}
                className="bg-purple-950/40 text-purple-400 border border-purple-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold"
              >
                <span>📌</span>
                {domain}
                <button
                  type="button"
                  onClick={() => removeCustomDomain(domain)}
                  className="text-red-400 hover:text-red-200 focus:outline-none"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <input
          type="text"
          placeholder="e.g., Coding, Volunteering"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomDomain()}
          className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors placeholder-zinc-600 text-sm"
        />
        <button
          onClick={addCustomDomain}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition-all text-sm font-semibold"
        >
          Add Custom
        </button>
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-4"
      >
        Complete Setup
      </button>
    </div>
  );
}

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'education-level' | 'education-details' | 'domains'>('education-level');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [educationDetails, setEducationDetails] = useState<EducationDetails | null>(null);
  const { setUser, addDomain } = useApp();

  const handleEducationLevelNext = (level: EducationLevel) => {
    setEducationLevel(level);
    setStep('education-details');
  };

  const handleEducationDetailsNext = (details: EducationDetails) => {
    setEducationDetails(details);
    setStep('domains');
  };

  const handleDomainsNext = (
    defaultDomains: { id: string; label: string; icon: string; selected: boolean }[],
    customDomains: string[]
  ) => {
    if (!educationDetails) return;

    // Create user profile
    const user: UserProfile = {
      id: generateId(),
      name: 'Student',
      educationDetails,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    setUser(user);

    // Default configuration mappings
    const defaultDomainConfigs: Record<string, { label: string; icon: string; color: string }> = {
      academic_studies: { label: 'Academic Studies', icon: '🎓', color: '#3B82F6' },
      personal_studies: { label: 'Personal Studies', icon: '📚', color: '#8B5CF6' },
      sports: { label: 'Sports Practice', icon: '⚽', color: '#10B981' },
      hobbies: { label: 'Hobbies', icon: '🎮', color: '#F59E0B' },
      art: { label: 'Art / Creativity', icon: '🎨', color: '#EC4899' },
    };

    const domainColors = [
      '#06B6D4', '#14B8A6', '#F97316', '#6366F1', '#EC4899'
    ];

    // Add selected default domains
    let colorIndex = 0;
    defaultDomains.forEach((d) => {
      if (d.selected) {
        const config = defaultDomainConfigs[d.id];
        addDomain({
          id: d.id,
          name: config.label,
          description: `Track your ${config.label.toLowerCase()}`,
          isCustom: false,
          color: config.color,
          icon: config.icon,
          createdAt: Date.now(),
        });
      }
    });

    // Add custom domains
    customDomains.forEach((name) => {
      const cId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      addDomain({
        id: cId,
        name,
        description: `Track your custom sector: ${name}`,
        isCustom: true,
        color: domainColors[colorIndex % domainColors.length],
        icon: '📌',
        createdAt: Date.now(),
        });
      colorIndex++;
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1 text-center text-blue-500">Student Assistant</h1>
        <p className="text-center text-zinc-400 text-sm mb-6">Let's set up your profile and dashboard</p>

        {step === 'education-level' && (
          <EducationLevelStep onNext={handleEducationLevelNext} />
        )}

        {step === 'education-details' && educationLevel && (
          <EducationDetailsStep
            level={educationLevel}
            onNext={handleEducationDetailsNext}
            onBack={() => setStep('education-level')}
          />
        )}

        {step === 'domains' && (
          <DomainSelectionStep
            onNext={handleDomainsNext}
            onBack={() => setStep('education-details')}
          />
        )}
      </div>
    </div>
  );
}
