'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Task, TaskImage } from '@/types';
import { imageDb } from '@/lib/imageDb';
import { CheckSquare, Square, Trash2, Layers, Check, ChevronDown, ChevronUp, Link2, ListTodo, X, CheckCircle } from 'lucide-react';

// Subcomponent to load and render task images asynchronously from IndexedDB
function TaskImagesViewer({ imageIds }: { imageIds: string[] }) {
  const [images, setImages] = useState<TaskImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageIds || imageIds.length === 0) {
      setImages([]);
      return;
    }

    const loadImages = async () => {
      setLoading(true);
      try {
        const loaded: TaskImage[] = [];
        for (const id of imageIds) {
          const img = await imageDb.getImage(id);
          if (img) loaded.push(img);
        }
        setImages(loaded);
      } catch (err) {
        console.error('Failed to load task images:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [imageIds]);

  if (loading) {
    return <span className="text-[10px] text-zinc-500 font-mono">Loading attachments...</span>;
  }

  if (images.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-2">
      <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Image Attachments</p>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative group border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.compressedData}
              alt={img.name}
              className="w-full h-20 object-cover cursor-zoom-in"
              onClick={() => {
                const w = window.open();
                if (w) w.document.write(`<img src="${img.compressedData}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[8px] text-zinc-300 truncate" title={img.name}>
              {img.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaskManager() {
  const { state, addTask, toggleTaskCompletion, deleteTask, updateTask, startTimer } = useApp();
  
  // Creation tabs
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  
  // Single task form state
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState('');
  const [subdomain, setSubdomain] = useState('');
  
  // Rich task additions
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // Local task images uploads state
  const [imagesList, setImagesList] = useState<{ id: string; name: string; compressedData: string; size: number }[]>([]);

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

  // Expanded task cards tracking
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Filter archived sectors for active drop-down lists
  const activeDomains = useMemo(() => {
    return state.domains.filter((d) => !d.isArchived);
  }, [state.domains]);

  const domainMap = useMemo(() => {
    const map: Record<string, { name: string; color: string; icon?: string }> = {};
    state.domains.forEach((d) => {
      map[d.id] = { name: d.name, color: d.color, icon: d.icon };
    });
    return map;
  }, [state.domains]);

  // Set default domain IDs if active domains exist
  useEffect(() => {
    if (activeDomains.length > 0) {
      Promise.resolve().then(() => {
        if (!domainId) setDomainId(activeDomains[0].id);
        if (!batchDomainId) setBatchDomainId(activeDomains[0].id);
      });
    }
  }, [activeDomains, domainId, batchDomainId]);

  // --- Draft persistence logic ---
  // Load draft from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('student-assistant-task-draft');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        Promise.resolve().then(() => {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.domainId) setDomainId(parsed.domainId);
          if (parsed.subdomain) setSubdomain(parsed.subdomain);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.checklist) setChecklist(parsed.checklist);
          if (parsed.links) setLinks(parsed.links);
          if (parsed.imagesList) setImagesList(parsed.imagesList);
        });
      } catch (err) {
        console.error('Failed to parse cached task draft:', err);
      }
    }
  }, []);

  // Save draft to localStorage when inputs change
  useEffect(() => {
    if (!title.trim() && !description.trim() && checklist.length === 0 && links.length === 0 && imagesList.length === 0) {
      // Don't save empty drafts
      localStorage.removeItem('student-assistant-task-draft');
      return;
    }
    const draftData = {
      title,
      domainId,
      subdomain,
      description,
      checklist,
      links,
      imagesList,
    };
    localStorage.setItem('student-assistant-task-draft', JSON.stringify(draftData));
  }, [title, domainId, subdomain, description, checklist, links, imagesList]);

  // Discard draft manually
  const handleDiscardDraft = () => {
    setTitle('');
    setSubdomain('');
    setDescription('');
    setChecklist([]);
    setLinks([]);
    setImagesList([]);
    setAlreadyCompleted(false);
    setLogHours(0);
    setLogMinutes(0);
    setLogNotes('');
    localStorage.removeItem('student-assistant-task-draft');
  };

  // --- Rich fields handlers ---
  const handleAddChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    setChecklist([...checklist, { text, done: false }]);
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    const label = linkLabel.trim();
    let url = linkUrl.trim();
    if (!label || !url) return;

    // URL Validation: Prepend https:// if protocol is missing
    const hasProtocol = /^https?:\/\//i.test(url);
    if (!hasProtocol) {
      url = 'https://' + url;
    }

    // Simple domain validating check
    const isValidUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(url);
    if (!isValidUrl) {
      alert('Please enter a valid URL (e.g. github.com or https://google.com)');
      return;
    }

    setLinks([...links, { label, url }]);
    setLinkLabel('');
    setLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Image upload handling with size check and Base64 compressor
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagesList.length + files.length > 3) {
      alert('Maximum of 3 image attachments allowed per task.');
      return;
    }

    Array.from(files).forEach((file) => {
      // Check size limit: 500KB
      const maxSize = 500 * 1024;
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds the 500KB size limit. Please upload a smaller or compressed image.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagesList((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            compressedData: base64String,
            size: file.size,
          },
        ]);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
      };
      reader.readAsDataURL(file);
    });

    // Clear input
    e.target.value = '';
  };

  const handleRemoveImageDraft = (id: string) => {
    setImagesList(imagesList.filter((img) => img.id !== id));
  };

  // --- Task Submission ---
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !domainId) {
      alert('Please enter a task title and select a sector');
      return;
    }

    const tId = Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    // Normalizations
    const normalizedTitle = title.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    const normalizedSubdomain = subdomain.trim()
      ? subdomain.trim().replace(/\b\w/g, (c) => c.toUpperCase())
      : undefined;

    // 1. Save uploaded images to IndexedDB
    const savedImageIds: string[] = [];
    try {
      for (const img of imagesList) {
        await imageDb.saveImage({
          id: img.id,
          name: img.name,
          compressedData: img.compressedData,
          size: img.size,
        });
        savedImageIds.push(img.id);
      }
    } catch (err) {
      console.error('Failed to write images to IndexedDB:', err);
      alert('Could not save image attachments. Saving task without media.');
    }

    // 2. Add task
    const task: Omit<Task, 'domainNameSnapshot'> = {
      id: tId,
      title: normalizedTitle,
      domainId,
      subdomain: normalizedSubdomain,
      status: alreadyCompleted ? 'completed' : 'pending',
      createdAt: now,
      completedAt: alreadyCompleted ? now : undefined,
      description: description.trim() || undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
      links: links.length > 0 ? links : undefined,
      imageIds: savedImageIds.length > 0 ? savedImageIds : undefined,
    };

    addTask(task);

    // If already completed and duration > 0, log execution in ActivityLog
    const duration = logHours + (logMinutes / 60);
    if (alreadyCompleted && duration > 0) {
      toggleTaskCompletion(tId, parseFloat(duration.toFixed(3)), logNotes.trim());
    }

    // Reset Form (Draft is cleared automatically inside AppContext.addTask)
    setTitle('');
    setSubdomain('');
    setDescription('');
    setChecklist([]);
    setLinks([]);
    setImagesList([]);
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
      const normalizedTitle = line.replace(/\b\w/g, (c) => c.toUpperCase());
      
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
      toggleTaskCompletion(task.id);
    } else {
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
      startTimer(completingTask.domainId, completingTask.title, completingTask.subdomain, completingTask.id);
      alert(`Timer started for task "${completingTask.title}"!`);
    } else {
      toggleTaskCompletion(completingTask.id);
    }

    setCompletingTask(null);
  };

  // Toggle lazy expansion on task card click
  const toggleExpandTask = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Inline toggle of checklist items inside task card
  const handleToggleChecklistItem = (task: Task, index: number) => {
    if (!task.checklist) return;
    const updatedChecklist = task.checklist.map((item, idx) =>
      idx === index ? { ...item, done: !item.done } : item
    );
    updateTask(task.id, { checklist: updatedChecklist });
  };

  // Tasks sorting
  const pendingTasks = useMemo(() => {
    return state.tasks.filter((t) => t.status === 'pending').sort((a, b) => b.createdAt - a.createdAt);
  }, [state.tasks]);

  const completedTasks = useMemo(() => {
    return state.tasks.filter((t) => t.status === 'completed').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [state.tasks]);

  return (
    <div className="space-y-6 text-zinc-100 font-sans">
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
              Single Intention
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'batch' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400'
              }`}
            >
              Batch Intentions
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
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-700 font-medium"
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
                    {activeDomains.map((d) => (
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

              {/* Long Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Task Description</label>
                <textarea
                  placeholder="Enter details about this productivity task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 placeholder-zinc-700 resize-none"
                />
              </div>

              {/* Checklist Creator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400">Sub-Checklist Notes</label>
                {checklist.length > 0 && (
                  <div className="space-y-1 max-h-[100px] overflow-y-auto bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    {checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="truncate">{item.text}</span>
                        <button type="button" onClick={() => handleRemoveChecklistItem(idx)} className="text-red-400 text-[10px] hover:underline">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 px-2.5 py-1.5 rounded-lg text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Links Creator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400">Reference Links</label>
                {links.length > 0 && (
                  <div className="space-y-1 max-h-[100px] overflow-y-auto bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-zinc-350">
                        <span className="truncate text-blue-400">{link.label}</span>
                        <button type="button" onClick={() => handleRemoveLink(idx)} className="text-red-400 text-[10px] hover:underline">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Link Label (e.g. GitHub)"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 px-2.5 py-1 rounded-lg text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="URL (e.g. github.com)"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 px-2.5 py-1 rounded-lg text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-bold"
                    >
                      Attach
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Attachments */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400">Attachments (Max 3, 500KB each)</label>
                {imagesList.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {imagesList.map((img) => (
                      <div key={img.id} className="relative w-12 h-12 border border-zinc-850 rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.compressedData} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageDraft(img.id)}
                          className="absolute top-0 right-0 bg-red-600/90 text-white rounded-bl p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  multiple
                  className="block w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-zinc-700 file:text-xs file:font-semibold file:bg-zinc-850 file:text-zinc-200 hover:file:bg-zinc-750 cursor-pointer"
                />
              </div>

              {/* Already Completed Checkbox */}
              <div className="pt-1.5">
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
                <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl space-y-3 animate-fade-in">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Execution duration</p>
                  <div className="grid grid-cols-2 gap-2.5">
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

              {/* Submit / Discard buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="flex-1 bg-zinc-855 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Discard Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Add Intention
                </button>
              </div>
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
                  {activeDomains.map((d) => (
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
                  const domain = domainMap[task.domainId] || { name: task.domainNameSnapshot, color: '#6B7280', icon: '📌' };
                  const isExpanded = !!expandedTaskIds[task.id];

                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-2 hover:border-zinc-700 transition-all select-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleCheckboxClick(task)}
                            className="text-zinc-650 hover:text-zinc-200 transition-colors mt-0.5 flex-shrink-0"
                          >
                            <Square size={19} />
                          </button>
                          
                          {/* Toggle expand click */}
                          <div className="cursor-pointer" onClick={() => toggleExpandTask(task.id)}>
                            <p className="text-sm font-bold text-zinc-100 leading-tight">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
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

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpandTask(task.id)}
                            className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-900"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-zinc-550 hover:text-red-400 p-2 hover:bg-zinc-900/50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Lazy Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-zinc-850 pt-3 mt-1 space-y-3 animate-fade-in text-xs">
                          {/* Long Description */}
                          {task.description && (
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Details</p>
                              <p className="text-zinc-300 leading-relaxed font-sans">{task.description}</p>
                            </div>
                          )}

                          {/* Sub-checklists (Interactive!) */}
                          {task.checklist && task.checklist.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                                <ListTodo size={10} /> Checklist
                              </p>
                              <div className="grid gap-1">
                                {task.checklist.map((item, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none hover:text-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => handleToggleChecklistItem(task, index)}
                                      className="w-3.5 h-3.5 rounded border-zinc-800 text-blue-600 focus:ring-0 bg-zinc-950"
                                    />
                                    <span className={item.done ? 'line-through text-zinc-550' : ''}>{item.text}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reference Links */}
                          {task.links && task.links.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                                <Link2 size={10} /> Links
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {task.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                                  >
                                    <span>🔗</span> {link.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images Viewer from IndexedDB */}
                          {task.imageIds && task.imageIds.length > 0 && (
                            <TaskImagesViewer imageIds={task.imageIds} />
                          )}
                        </div>
                      )}
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
              <div className="grid gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {completedTasks.map((task) => {
                  const domain = domainMap[task.domainId] || { name: task.domainNameSnapshot, color: '#6B7280', icon: '📌' };
                  const isExpanded = !!expandedTaskIds[task.id];

                  return (
                    <div
                      key={task.id}
                      className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-2 opacity-65 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleCheckboxClick(task)}
                            className="text-green-500 hover:text-zinc-400 transition-colors mt-0.5"
                          >
                            <CheckSquare size={19} />
                          </button>
                          <div className="cursor-pointer" onClick={() => toggleExpandTask(task.id)}>
                            <p className="text-sm font-semibold text-zinc-400 line-through leading-tight">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
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
                              {task.completedAt && (
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  Done {new Date(task.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleExpandTask(task.id)}
                            className="p-1 text-zinc-650 hover:text-zinc-350 rounded"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-zinc-600 hover:text-red-400 p-2 hover:bg-zinc-900/50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Lazy Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-zinc-850 pt-3 mt-1 space-y-3 animate-fade-in text-xs">
                          {task.description && (
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Details</p>
                              <p className="text-zinc-400 leading-relaxed font-sans">{task.description}</p>
                            </div>
                          )}

                          {task.checklist && task.checklist.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Checklist status</p>
                              <div className="grid gap-1">
                                {task.checklist.map((item, index) => (
                                  <div key={index} className="flex items-center gap-2 text-zinc-400">
                                    <span>{item.done ? '✓' : '•'}</span>
                                    <span className={item.done ? 'line-through text-zinc-600' : ''}>{item.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {task.links && task.links.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Reference Links</p>
                              <div className="flex flex-wrap gap-2">
                                {task.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px]"
                                  >
                                    <span>🔗</span> {link.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {task.imageIds && task.imageIds.length > 0 && (
                            <TaskImagesViewer imageIds={task.imageIds} />
                          )}
                        </div>
                      )}
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
              <p className="text-xs text-zinc-400">&quot;{completingTask.title}&quot;</p>
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
                      <label className="block text-xs font-semibold text-zinc-550 mb-1">Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={compHours}
                        onChange={(e) => setCompHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-550 mb-1">Minutes</label>
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
                    <label className="block text-xs font-semibold text-zinc-550 mb-1">Notes</label>
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
