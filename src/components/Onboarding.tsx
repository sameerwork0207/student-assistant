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
      <h2 className="text-2xl font-bold">What is your education level?</h2>
      <p className="text-gray-600">This helps us personalize your experience</p>

      <div className="grid gap-3">
        {[
          { level: EducationLevel.SCHOOL, label: 'School', icon: '🎒' },
          { level: EducationLevel.JUNIOR_COLLEGE, label: 'Junior College', icon: '📚' },
          { level: EducationLevel.DEGREE_COLLEGE, label: 'Degree College', icon: '🎓' },
        ].map(({ level, label, icon }) => (
          <button
            key={level}
            onClick={() => onNext(level)}
            className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <span className="text-3xl mr-3">{icon}</span>
            <span className="text-lg font-semibold">{label}</span>
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
        alert('Please enter your degree');
        return;
      }
      details = { level, degree, specialization, year } as DegreeCollegeDetails;
    }

    onNext(details);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-blue-500 hover:underline mb-4">
        ← Back
      </button>

      {level === EducationLevel.SCHOOL && (
        <>
          <h2 className="text-2xl font-bold">What is your class/grade?</h2>
          <input
            type="text"
            placeholder="e.g., 10, 11, 12"
            value={classGrade}
            onChange={(e) => setClassGrade(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </>
      )}

      {level === EducationLevel.JUNIOR_COLLEGE && (
        <>
          <h2 className="text-2xl font-bold">What is your stream?</h2>
          <div className="grid gap-3">
            {(['Science', 'Commerce', 'Arts'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStream(s)}
                className={`p-3 border-2 rounded-lg transition-all ${
                  stream === s
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {level === EducationLevel.DEGREE_COLLEGE && (
        <>
          <h2 className="text-2xl font-bold">Tell us about your degree</h2>
          <input
            type="text"
            placeholder="e.g., B.Tech, B.A., B.Com"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Specialization (optional)"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <div>
            <label className="block text-sm font-semibold mb-2">Current Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>
        </>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-all"
      >
        Next
      </button>
    </div>
  );
}

interface DomainSelectionStepProps {
  onNext: (domains: string[]) => void;
  onBack: () => void;
}

export function DomainSelectionStep({ onNext, onBack }: DomainSelectionStepProps) {
  const defaultDomains = [
    { id: 'academic_studies', label: 'Academic Studies', icon: '📖', selected: true },
    { id: 'personal_studies', label: 'Personal Studies', icon: '📚', selected: true },
    { id: 'sports_hobbies', label: 'Sports / Hobbies / Art', icon: '🎨', selected: true },
  ];

  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultDomains.filter((d) => d.selected).map((d) => d.id))
  );
  const [customDomain, setCustomDomain] = useState('');
  const [customDomains, setCustomDomains] = useState<string[]>([]);

  const toggleDomain = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const addCustomDomain = () => {
    if (customDomain.trim() && !customDomains.includes(customDomain)) {
      setCustomDomains([...customDomains, customDomain]);
      setSelected(new Set([...Array.from(selected), customDomain]));
      setCustomDomain('');
    }
  };

  const removeCustomDomain = (domain: string) => {
    setCustomDomains(customDomains.filter((d) => d !== domain));
    const newSelected = new Set(selected);
    newSelected.delete(domain);
    setSelected(newSelected);
  };

  const handleNext = () => {
    if (selected.size === 0) {
      alert('Please select at least one domain');
      return;
    }
    onNext(Array.from(selected));
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-blue-500 hover:underline mb-4">
        ← Back
      </button>

      <h2 className="text-2xl font-bold">What areas of your life do you want to track?</h2>
      <p className="text-gray-600">You can add custom domains later</p>

      <div className="space-y-3">
        {defaultDomains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => toggleDomain(domain.id)}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              selected.has(domain.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span className="text-2xl mr-3">{domain.icon}</span>
            <span className="font-semibold">{domain.label}</span>
          </button>
        ))}
      </div>

      {customDomains.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-sm">Custom Domains</p>
          {customDomains.map((domain) => (
            <div
              key={domain}
              className="p-3 bg-purple-50 border-2 border-purple-300 rounded-lg flex justify-between items-center"
            >
              <span>{domain}</span>
              <button
                onClick={() => removeCustomDomain(domain)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add custom domain..."
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomDomain()}
          className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={addCustomDomain}
          className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
        >
          Add
        </button>
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-all"
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

  const handleDomainsNext = (domains: string[]) => {
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

    // Create domains
    const defaultDomainNames: Record<string, { label: string; icon: string }> = {
      academic_studies: { label: 'Academic Studies', icon: '📖' },
      personal_studies: { label: 'Personal Studies', icon: '📚' },
      sports_hobbies_art: { label: 'Sports / Hobbies / Art', icon: '🎨' },
    };

    const domainColors = [
      '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
      '#06B6D4', '#14B8A6', '#F97316', '#6366F1',
    ];

    domains.forEach((domainId, index) => {
      const domainConfig = defaultDomainNames[domainId];
      const isCustom = !domainConfig;

      addDomain({
        id: domainId,
        name: domainConfig?.label || domainId,
        description: '',
        isCustom,
        color: domainColors[index % domainColors.length],
        icon: domainConfig?.icon,
        createdAt: Date.now(),
      });
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">Student Assistant</h1>
        <p className="text-center text-gray-600 mb-8">Let's get you set up!</p>

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
