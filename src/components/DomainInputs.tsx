'use client';

import React, { useState } from 'react';
import { TaskEntry, AcademicTask, SportsArtTask, SocialSkillsTask, PersonalStudiesTask } from '@/types';
import { useApp } from '@/context/AppContext';
import { generateId, getTodayMidnight, timeToHours } from '@/lib/utils';

interface DomainInputProps {
  domainId: string;
  domainName: string;
  onTaskAdded?: () => void;
}

/**
 * Academic Studies Input Form
 */
export function AcademicStudiesInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { addTask } = useApp();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [subject, setSubject] = useState('');
  const [unitStudied, setUnitStudied] = useState('');
  const [conceptsCleared, setConceptsCleared] = useState<'Yes' | 'Partial' | 'No'>('Yes');
  const [revisionDone, setRevisionDone] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !unitStudied.trim()) {
      alert('Please fill in subject and unit studied');
      return;
    }

    const task: TaskEntry = {
      id: generateId(),
      domainId,
      data: {
        type: 'academic',
        date: getTodayMidnight(),
        hoursSpent: timeToHours(hours, minutes),
        subject,
        unitStudied,
        conceptsCleared,
        revisionDone,
        notes,
      } as AcademicTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(task);
    
    // Reset form
    setHours(1);
    setMinutes(0);
    setSubject('');
    setUnitStudied('');
    setConceptsCleared('Yes');
    setRevisionDone(false);
    setNotes('');
    
    onTaskAdded?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Hours</label>
          <input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Minutes</label>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Subject</label>
        <input
          type="text"
          placeholder="e.g., Mathematics, English"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Unit / Topic Studied</label>
        <input
          type="text"
          placeholder="e.g., Calculus - Chapter 5"
          value={unitStudied}
          onChange={(e) => setUnitStudied(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Concepts Cleared</label>
        <div className="grid grid-cols-3 gap-2">
          {(['Yes', 'Partial', 'No'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setConceptsCleared(option)}
              className={`p-2 rounded-lg font-medium transition-colors ${
                conceptsCleared === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={revisionDone}
            onChange={(e) => setRevisionDone(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-semibold">Revision Done</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Notes</label>
        <textarea
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Log Study Session
      </button>
    </form>
  );
}

/**
 * Sports / Art Input Form
 */
export function SportsArtInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { addTask } = useApp();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [skillsPracticed, setSkillsPracticed] = useState('');
  const [skillsLearned, setSkillsLearned] = useState('');
  const [performancesAttended, setPerformancesAttended] = useState(0);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const task: TaskEntry = {
      id: generateId(),
      domainId,
      data: {
        type: 'sports_art',
        date: getTodayMidnight(),
        hoursSpent: timeToHours(hours, minutes),
        skillsPracticed: skillsPracticed.split(',').filter((s) => s.trim()),
        skillsLearned: skillsLearned.split(',').filter((s) => s.trim()),
        performancesAttended,
        notes,
      } as SportsArtTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(task);
    
    setHours(1);
    setMinutes(0);
    setSkillsPracticed('');
    setSkillsLearned('');
    setPerformancesAttended(0);
    setNotes('');
    
    onTaskAdded?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Hours</label>
          <input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Minutes</label>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Skills Practiced</label>
        <input
          type="text"
          placeholder="e.g., Dribbling, Passing (comma-separated)"
          value={skillsPracticed}
          onChange={(e) => setSkillsPracticed(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">New Skills Learned</label>
        <input
          type="text"
          placeholder="e.g., Backhand, Defense (comma-separated)"
          value={skillsLearned}
          onChange={(e) => setSkillsLearned(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Performances / Shows Attended</label>
        <input
          type="number"
          min="0"
          value={performancesAttended}
          onChange={(e) => setPerformancesAttended(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Notes</label>
        <textarea
          placeholder="How did it go? Any thoughts?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Log {domainName}
      </button>
    </form>
  );
}

/**
 * Social Skills Input Form
 */
export function SocialSkillsInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { state, addTask } = useApp();
  const [peopleInteracted, setPeopleInteracted] = useState(1);
  const [newPeopleMet, setNewPeopleMet] = useState(0);
  const [lifetimeStrangers, setLifetimeStrangers] = useState(
    state.tasks
      .filter((t) => (t.data as any).type === 'social')
      .reduce((max, t) => Math.max(max, (t.data as any).lifetimeStrangersTalked || 0), 0)
  );
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLifetime = lifetimeStrangers + newPeopleMet;

    const task: TaskEntry = {
      id: generateId(),
      domainId,
      data: {
        type: 'social',
        date: getTodayMidnight(),
        peopleInteracted,
        newPeopleMet,
        lifetimeStrangersTalked: newLifetime,
        notes,
      } as SocialSkillsTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(task);
    
    setPeopleInteracted(1);
    setNewPeopleMet(0);
    setLifetimeStrangers(newLifetime);
    setNotes('');
    
    onTaskAdded?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">People Interacted With</label>
        <input
          type="number"
          min="0"
          value={peopleInteracted}
          onChange={(e) => setPeopleInteracted(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">New People Met</label>
        <input
          type="number"
          min="0"
          value={newPeopleMet}
          onChange={(e) => setNewPeopleMet(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-900">
          Lifetime Strangers Talked To: <span className="text-lg">{lifetimeStrangers}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Notes</label>
        <textarea
          placeholder="Interesting interactions?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Log Social Activity
      </button>
    </form>
  );
}

/**
 * Personal Studies Input Form
 */
export function PersonalStudiesInput({ domainId, domainName, onTaskAdded }: DomainInputProps) {
  const { addTask } = useApp();
  const [subDomain, setSubDomain] = useState('');
  const [task, setTask] = useState('');
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subDomain.trim() || !task.trim()) {
      alert('Please fill in sub-domain and task');
      return;
    }

    const newTask: TaskEntry = {
      id: generateId(),
      domainId,
      data: {
        type: 'personal',
        date: getTodayMidnight(),
        subDomain,
        task,
        hoursSpent: timeToHours(hours, minutes),
        completed,
        notes,
      } as PersonalStudiesTask,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTask(newTask);
    
    setSubDomain('');
    setTask('');
    setHours(1);
    setMinutes(0);
    setCompleted(false);
    setNotes('');
    
    onTaskAdded?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Sub-Domain</label>
        <input
          type="text"
          placeholder="e.g., Programming, Design"
          value={subDomain}
          onChange={(e) => setSubDomain(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Task</label>
        <input
          type="text"
          placeholder="e.g., Build Todo App"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Hours</label>
          <input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Minutes</label>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="font-semibold">Task Completed</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Notes</label>
        <textarea
          placeholder="What did you learn?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Log Task
      </button>
    </form>
  );
}
