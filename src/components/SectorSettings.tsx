'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Archive, Edit2, AlertCircle, Check } from 'lucide-react';

export function SectorSettings() {
  const { state, addDomain, renameDomain, archiveDomain } = useApp();

  // New domain form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#3B82F6');
  const [description, setDescription] = useState('');

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', // Blue, Green, Amber, Purple, Pink
    '#EF4444', '#06B6D4', '#14B8A6', '#F97316', '#6366F1', // Red, Cyan, Teal, Orange, Indigo
  ];

  const icons = ['🎓', '📚', '⚽', '🎮', '🎨', '💻', '💼', '✍️', '🎸', '🌱', '📌', '⚖️'];

  const activeDomains = state.domains.filter((d) => !d.isArchived);
  const archivedDomains = state.domains.filter((d) => d.isArchived);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Sector name is required.');
      return;
    }

    const cId = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if ID already exists
    if (state.domains.some((d) => d.id === cId)) {
      alert('A sector with a similar name already exists.');
      return;
    }

    addDomain({
      id: cId,
      name: name.trim(),
      description: description.trim() || undefined,
      isCustom: true,
      color,
      icon,
      createdAt: Date.now(),
    });

    setName('');
    setDescription('');
    setIcon('📌');
    setColor('#3B82F6');
    alert('Sector created successfully!');
  };

  const handleRenameSubmit = (id: string) => {
    if (!renameText.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    renameDomain(id, renameText.trim());
    setEditingId(null);
    setRenameText('');
  };

  const handleArchive = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to remove the sector "${name}"?\n\nThis will safely archive it. Past tasks and logs will retain the name "${name}" but you won't be able to select this sector for new tasks or logs.`
      )
    ) {
      archiveDomain(id);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sector Configuration</h2>
        <p className="text-sm text-zinc-400">Configure study/productivity areas. Archiving a sector preserves historical entries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator panel */}
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Add New Sector</h3>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Sector Name</label>
            <input
              type="text"
              placeholder="e.g. Freelancing, Interview Prep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Description (optional)</label>
            <input
              type="text"
              placeholder="e.g. Client work or portfolio building"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Sector Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIcon(item)}
                  className={`p-2 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    icon === item
                      ? 'border-blue-500 bg-blue-600/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Sector Color</label>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border border-zinc-950 relative flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold transition-all mt-2 flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> Create Sector
          </button>
        </form>

        {/* Sectors listing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sectors */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Active Sectors</h3>
            
            <div className="grid gap-3">
              {activeDomains.map((dom) => (
                <div
                  key={dom.id}
                  className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <span className="text-2xl p-2 bg-zinc-900 border border-zinc-800 rounded-xl">{dom.icon || '📌'}</span>
                    
                    {editingId === dom.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(dom.id)}
                        />
                        <button
                          onClick={() => handleRenameSubmit(dom.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-zinc-400 hover:text-white px-2 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dom.color }} />
                          {dom.name}
                        </h4>
                        {dom.description && <p className="text-xs text-zinc-500 truncate mt-0.5">{dom.description}</p>}
                      </div>
                    )}
                  </div>

                  {editingId !== dom.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(dom.id);
                          setRenameText(dom.name);
                        }}
                        className="p-2 text-zinc-450 hover:text-white hover:bg-zinc-800/40 rounded-lg transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleArchive(dom.id, dom.name)}
                        className="p-2 text-zinc-450 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Archived Sectors */}
          {archivedDomains.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-1 text-zinc-500">
                <AlertCircle size={15} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Archived Sectors (Immutable)</h3>
              </div>

              <div className="grid gap-2.5 opacity-60">
                {archivedDomains.map((dom) => (
                  <div
                    key={dom.id}
                    className="bg-zinc-950 border border-zinc-900 p-3 py-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span>{dom.icon || '📌'}</span>
                      <span className="font-semibold text-zinc-400">{dom.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-650 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md font-mono uppercase tracking-widest font-bold">
                      Archived
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
