import React, { useState, useEffect } from 'react';
import { JournalInteraction, JournalTurn, ReflectionMode, MoodSentiment, PinnedLocation } from '../types';
import { FormattedContent } from './FormattedContent';
import { LocationPickerModal } from './LocationPickerModal';
import { stripMarkdown } from '../utils/sanitize';
import {
  Sparkles,
  Send,
  Save,
  Clock,
  Copy,
  Check,
  Brain,
  FileText,
  Lightbulb,
  Compass,
  AlertCircle,
  Heart,
  MapPin,
} from 'lucide-react';

interface JournalEditorProps {
  initialInteraction?: JournalInteraction | null;
  onSaveInteraction: (interaction: JournalInteraction) => Promise<boolean>;
  isSaving: boolean;
  saveError: string | null;
  onClearError: () => void;
  userId: string;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  initialInteraction,
  onSaveInteraction,
  isSaving,
  saveError,
  onClearError,
  userId,
}) => {
  const [entryId, setEntryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [entryText, setEntryText] = useState<string>('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [turns, setTurns] = useState<JournalTurn[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [mood, setMood] = useState<MoodSentiment | undefined>(initialInteraction?.mood);
  const [location, setLocation] = useState<PinnedLocation | undefined>(initialInteraction?.location);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isAnalyzingMood, setIsAnalyzingMood] = useState<boolean>(false);
  const [followUpText, setFollowUpText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Sync when initialInteraction changes
  useEffect(() => {
    if (initialInteraction) {
      setEntryId(initialInteraction.id);
      setTitle(initialInteraction.title);
      setEntryText(initialInteraction.entryText);
      setMode(initialInteraction.mode || 'reflection');
      setTurns(initialInteraction.turns || []);
      setAiSummary(initialInteraction.aiSummary || '');
      setMood(initialInteraction.mood);
      setLocation(initialInteraction.location);
      setLastSavedTime(initialInteraction.updatedAt || initialInteraction.createdAt);
      setGenerationError(null);
      onClearError();
    } else {
      const newId = `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setEntryId(newId);
      setTitle('');
      setEntryText('');
      setMode('reflection');
      setTurns([]);
      setAiSummary('');
      setMood(undefined);
      setLocation(undefined);
      setLastSavedTime(null);
      setGenerationError(null);
      onClearError();
    }
  }, [initialInteraction]);

  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).length : 0;
  const charCount = entryText.length;

  const modeOptions: { id: ReflectionMode; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    {
      id: 'reflection',
      label: 'Mindful Reflection',
      icon: Compass,
      desc: 'Empathetic validation & emotional perspective',
    },
    {
      id: 'summary',
      label: 'Executive Summary',
      icon: FileText,
      desc: 'Core emotional themes & structured recap',
    },
    {
      id: 'brainstorm',
      label: 'Creative Brainstorm',
      icon: Lightbulb,
      desc: 'Fresh angles & constructive next steps',
    },
    {
      id: 'deep_dive',
      label: 'Deep-Dive Inquiry',
      icon: Brain,
      desc: 'Philosophical self-discovery questions',
    },
  ];

  const handleGenerateReflection = async (customPrompt?: string, targetMode?: ReflectionMode) => {
    const textToReflectOn = customPrompt || entryText;
    const activeMode = targetMode || mode;

    if (!textToReflectOn.trim()) {
      setGenerationError('Please write down your reflection or prompt first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    onClearError();

    try {
      const activeTitle = title.trim() || `Reflections on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      if (!title.trim()) {
        setTitle(activeTitle);
      }

      const contextHistory = turns.map(t => ({
        role: t.role,
        text: t.text,
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToReflectOn,
          title: activeTitle,
          mode: activeMode,
          contextHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error (${res.status})`);
      }

      const data = await res.json();
      const now = new Date().toISOString();

      const newTurns: JournalTurn[] = [...turns];
      
      if (customPrompt) {
        newTurns.push({
          id: `turn_${Date.now()}_u`,
          role: 'user',
          text: customPrompt,
          timestamp: now,
          mode: activeMode,
        });
      } else if (turns.length === 0) {
        newTurns.push({
          id: `turn_${Date.now()}_u`,
          role: 'user',
          text: textToReflectOn,
          timestamp: now,
          mode: activeMode,
        });
      }

      newTurns.push({
        id: `turn_${Date.now()}_g`,
        role: 'gemini',
        text: data.reply,
        timestamp: data.timestamp || now,
        mode: activeMode,
      });

      setTurns(newTurns);
      if (customPrompt) {
        setFollowUpText('');
      }

      if (data.mood) {
        setMood(data.mood);
      }

      const interactionPayload: JournalInteraction = {
        id: entryId,
        userId,
        title: activeTitle,
        entryText,
        mode: activeMode,
        turns: newTurns,
        aiSummary: activeMode === 'summary' ? data.reply : aiSummary,
        mood: data.mood || mood,
        location,
        tags: [activeMode],
        createdAt: initialInteraction?.createdAt || now,
        updatedAt: now,
      };

      const saveSuccess = await onSaveInteraction(interactionPayload);
      if (saveSuccess) {
        setLastSavedTime(now);
      }
    } catch (err: any) {
      console.error('Error in handleGenerateReflection:', err);
      setGenerationError(err?.message || 'Failed to complete reflection with Gemini API');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeSentimentOnly = async () => {
    const textToAnalyze = entryText.trim() || turns.map(t => t.text).join('\n\n');
    if (!textToAnalyze) {
      setGenerationError('Please write some thoughts first to analyze sentiment.');
      return;
    }

    setIsAnalyzingMood(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/gemini/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          title: title.trim() || 'Journal Entry',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate sentiment with Gemini.');
      }

      const data = await res.json();
      if (data.mood) {
        setMood(data.mood);
        const now = new Date().toISOString();
        const updatedPayload: JournalInteraction = {
          id: entryId,
          userId,
          title: title.trim() || `Reflections on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          entryText,
          mode,
          turns,
          aiSummary,
          mood: data.mood,
          location,
          tags: [mode],
          createdAt: initialInteraction?.createdAt || now,
          updatedAt: now,
        };
        await onSaveInteraction(updatedPayload);
        setLastSavedTime(now);
      }
    } catch (err: any) {
      console.error('Sentiment analysis error:', err);
      setGenerationError(err.message || 'Mood evaluation could not be completed.');
    } finally {
      setIsAnalyzingMood(false);
    }
  };

  const handleManualSave = async () => {
    if (!entryText.trim() && !title.trim()) {
      setGenerationError('Cannot save empty entry.');
      return;
    }

    const now = new Date().toISOString();
    const interactionPayload: JournalInteraction = {
      id: entryId,
      userId,
      title: title.trim() || `Reflections on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      entryText,
      mode,
      turns,
      aiSummary,
      mood,
      location,
      tags: [mode],
      createdAt: initialInteraction?.createdAt || now,
      updatedAt: now,
    };

    const success = await onSaveInteraction(interactionPayload);
    if (success) {
      setLastSavedTime(now);
      onClearError();
    }
  };

  const handleSaveLocation = async (newLocation: PinnedLocation | undefined) => {
    setLocation(newLocation);
    // If entry already has content, save immediately to persist the location change
    if (entryText.trim() || title.trim()) {
      const now = new Date().toISOString();
      const updatedPayload: JournalInteraction = {
        id: entryId,
        userId,
        title: title.trim() || `Reflections on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        entryText,
        mode,
        turns,
        aiSummary,
        mood,
        location: newLocation,
        tags: [mode],
        createdAt: initialInteraction?.createdAt || now,
        updatedAt: now,
      };
      await onSaveInteraction(updatedPayload);
      setLastSavedTime(now);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTurnId(id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  // Extract latest Gemini insight if available
  const latestGeminiTurn = [...turns].reverse().find(t => t.role === 'gemini');

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[#fdfcfb]">
      {/* Main Editorial Canvas */}
      <section className="flex-1 flex flex-col p-6 sm:p-10 lg:p-12 overflow-y-auto relative">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col space-y-8">
          {/* Top Editorial Status & Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e5e1da]">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#a8a297]">
              <Clock className="w-3 h-3 text-[#a8a297]" />
              <span>
                {lastSavedTime
                  ? `Saved ${new Date(lastSavedTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Unsaved Draft'}
              </span>
              {isSaving && (
                <span className="text-[#1a1a1a] font-semibold pl-2 border-l border-[#e5e1da]">
                  Saving to Firestore...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-manual-save"
                onClick={handleManualSave}
                disabled={isSaving || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 font-sans text-xs uppercase tracking-widest text-[#1a1a1a] hover:bg-[#f5f2ee] border border-[#e5e1da] rounded-sm transition-colors cursor-pointer disabled:opacity-40"
                title="Save changes to Firestore"
              >
                <Save className="w-3.5 h-3.5 text-[#1a1a1a]" />
                <span>Save Record</span>
              </button>
            </div>
          </div>

          {/* Error Notification Banner */}
          {(saveError || generationError) && (
            <div className="p-4 bg-[#f5f2ee] border border-rose-300 text-rose-800 text-xs rounded-sm flex items-start justify-between gap-3 font-sans">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Persistence Notice:</p>
                  <p className="mt-0.5 text-rose-800">{saveError || generationError}</p>
                  <p className="mt-1 text-[10px] text-[#6b665c]">
                    Your drafted thoughts are preserved. You may retry immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (saveError) handleManualSave();
                  if (generationError) handleGenerateReflection();
                }}
                className="px-3 py-1 font-sans text-[10px] uppercase tracking-widest bg-[#1a1a1a] text-white rounded-sm shrink-0 cursor-pointer hover:bg-black"
              >
                Retry
              </button>
            </div>
          )}

          {/* Editorial Title Input */}
          <div className="space-y-2">
            <input
              id="input-entry-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Reflections on Synthesis"
              maxLength={150}
              className="w-full text-3xl sm:text-4xl italic font-normal font-serif text-[#1a1a1a] placeholder-[#a8a297] bg-transparent border-none focus:outline-none tracking-tight"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#a8a297]">
                  Current Session — ID_{entryId.slice(-6).toUpperCase()}
                </p>
                {location ? (
                  <div
                    id="editor-pinned-location-badge"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border border-[#dcd6c9] bg-[#f7f5f0] text-[#1a1a1a] text-xs font-sans shadow-2xs group cursor-pointer hover:bg-[#ede8df] transition-colors"
                    onClick={() => setIsLocationModalOpen(true)}
                    title={`Pinned: ${location.name}${location.address ? ` (${location.address})` : ''}. Click to view or edit on Google Map.`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span className="font-medium max-w-[200px] truncate">{location.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveLocation(undefined);
                      }}
                      className="text-[#a8a297] hover:text-red-700 ml-1 p-0.5 rounded-xs"
                      title="Remove pinned location"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn-open-pin-location"
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-dashed border-[#dcd6c9] text-[#6b665c] hover:text-[#1a1a1a] hover:border-[#1a1a1a] text-[11px] font-sans transition-colors cursor-pointer"
                    title="Pin a geographic location to this reflection"
                  >
                    <MapPin className="w-3 h-3 text-[#a8a297]" />
                    <span>+ Pin Location</span>
                  </button>
                )}
              </div>

              {mood && (
                <div
                  id="editor-mood-badge"
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs border text-xs font-sans shadow-2xs"
                  style={{
                    backgroundColor: `${mood.color}15`,
                    borderColor: `${mood.color}40`,
                    color: mood.color,
                  }}
                  title={`Mood Summary: ${mood.summary}`}
                >
                  <span className="text-sm leading-none">{mood.emoji}</span>
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    {mood.label}
                  </span>
                  <span className="text-[10px] opacity-75">
                    ({Math.round(mood.score * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reflection Mode Cards - Editorial Minimal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {modeOptions.map(opt => {
              const Icon = opt.icon;
              const isSelected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`btn-mode-${opt.id}`}
                  onClick={() => setMode(opt.id)}
                  className={`p-3 rounded-sm border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-[#f5f2ee] hover:bg-[#e5e1da]/60 border-[#e5e1da] text-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#6b665c]'}`} />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider">
                      {opt.label}
                    </span>
                  </div>
                  <p
                    className={`text-[9px] line-clamp-1 ${
                      isSelected ? 'text-stone-300' : 'text-[#a8a297]'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Primary Textarea / Draft Canvas */}
          <div className="space-y-3 pt-2">
            <div className="p-4 sm:p-6 bg-transparent border border-[#e5e1da] rounded-sm focus-within:border-[#1a1a1a] transition-colors">
              <textarea
                id="textarea-journal-entry"
                value={entryText}
                onChange={e => setEntryText(e.target.value)}
                placeholder="What occupies your mind today? Inquire into your ideas, architecture, and inner observations..."
                rows={6}
                className="w-full text-base sm:text-lg leading-relaxed text-[#4a453e] placeholder-[#a8a297] font-serif bg-transparent resize-y focus:outline-none"
              />

              <div className="pt-4 mt-2 border-t border-[#e5e1da] flex flex-wrap items-center justify-between gap-4">
                <div className="font-sans text-[10px] uppercase tracking-widest text-[#a8a297]">
                  <span>{wordCount} words</span>
                  <span className="mx-2">•</span>
                  <span>{charCount} characters</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    id="btn-analyze-mood-editor"
                    onClick={handleAnalyzeSentimentOnly}
                    disabled={isAnalyzingMood || isGenerating || !entryText.trim()}
                    className="px-3.5 py-2 font-sans text-[10px] uppercase tracking-widest text-[#6b665c] hover:text-[#1a1a1a] hover:bg-[#f5f2ee] border border-[#e5e1da] rounded-sm transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    title="Analyze entry mood and sentiment with Gemini"
                  >
                    {isAnalyzingMood ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-[#a8a297]" />
                        <span>{mood ? 'Re-detect Mood' : 'Detect Mood'}</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-reflect-gemini"
                    onClick={() => handleGenerateReflection()}
                    disabled={isGenerating || !entryText.trim()}
                    className="bg-[#1a1a1a] text-white px-6 py-2.5 font-sans text-xs uppercase tracking-widest hover:bg-black rounded-sm transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-2 shadow-xs"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-stone-300" />
                        <span>Reflect with Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Turn Conversational Thread - Editorial Design Pattern */}
          {turns.length > 0 && (
            <div className="pt-6 space-y-8">
              <div className="flex items-baseline justify-between border-b border-[#e5e1da] pb-3">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#a8a297]">
                  Reflection Dialogue
                </h3>
                <span className="font-serif italic text-xs text-[#6b665c]">
                  {turns.length} {turns.length === 1 ? 'Turn' : 'Turns'} recorded
                </span>
              </div>

              <div className="space-y-10">
                {turns.map((turn, index) => {
                  const isAi = turn.role === 'gemini';

                  if (!isAi) {
                    // User reflection block
                    return (
                      <div key={turn.id || index} className="flex flex-col gap-2 group">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-sans uppercase tracking-widest text-[#a8a297]">
                            Your Reflection
                          </p>
                          <span className="text-[9px] font-sans text-[#a8a297]">
                            {new Date(turn.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-base sm:text-lg leading-relaxed text-[#4a453e] font-serif">
                          {turn.text}
                        </p>
                      </div>
                    );
                  }

                  // Gemini reflection block - Signature Left-Border Quote Accent
                  return (
                    <div
                      key={turn.id || index}
                      className="flex flex-col gap-3 pl-6 sm:pl-8 border-l border-[#1a1a1a] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-sans uppercase tracking-widest text-[#1a1a1a] font-bold">
                            Gemini 3.6 Flash
                          </p>
                          {turn.mode && (
                            <span className="text-[9px] font-sans uppercase tracking-wider text-[#6b665c] bg-[#f5f2ee] px-1.5 py-0.5 rounded-xs">
                              {turn.mode}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => copyToClipboard(turn.id, turn.text)}
                          className="text-[#a8a297] hover:text-[#1a1a1a] transition-colors p-1"
                          title="Copy insight"
                        >
                          {copiedTurnId === turn.id ? (
                            <Check className="w-3.5 h-3.5 text-[#1a1a1a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <FormattedContent content={turn.text} isAi={true} />
                    </div>
                  );
                })}
              </div>

              {/* Continue Reflection Prompt Box */}
              <div className="pt-8 border-t border-[#e5e1da]">
                <div className="flex items-end gap-4">
                  <textarea
                    id="input-followup-prompt"
                    value={followUpText}
                    onChange={e => setFollowUpText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && followUpText.trim() && !isGenerating) {
                        e.preventDefault();
                        handleGenerateReflection(followUpText);
                      }
                    }}
                    placeholder="Continue the reflection..."
                    rows={2}
                    disabled={isGenerating}
                    className="flex-1 bg-transparent border-b border-[#e5e1da] focus:border-[#1a1a1a] text-lg sm:text-xl resize-none placeholder-[#a8a297] font-serif italic text-[#1a1a1a] focus:outline-none pb-2"
                  />

                  <button
                    id="btn-send-followup"
                    onClick={() => handleGenerateReflection(followUpText)}
                    disabled={isGenerating || !followUpText.trim()}
                    className="bg-[#1a1a1a] text-white px-6 py-3 font-sans text-xs uppercase tracking-widest hover:bg-black rounded-sm transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    Submit Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Editorial AI Synthesis Sidebar (from Design HTML) */}
      <aside className="hidden xl:flex w-80 bg-[#f5f2ee] border-l border-[#e5e1da] p-8 flex-col justify-between overflow-y-auto">
        <div className="space-y-10">
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#a8a297] mb-6">
              AI Synthesis
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-sans font-bold uppercase mb-1 text-[#1a1a1a]">
                  Primary Theme
                </p>
                <p className="text-sm text-[#4a453e] font-serif">
                  {title.trim() ? title : 'Structural Integrity & Clarity'}
                </p>
              </div>

              {/* Mood & Sentiment Card */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-sans font-bold uppercase text-[#1a1a1a]">
                    Detected Mood
                  </p>
                  {mood && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                  )}
                </div>
                {mood ? (
                  <div
                    className="p-3.5 rounded-sm border space-y-2.5 transition-all"
                    style={{
                      backgroundColor: `${mood.color}10`,
                      borderColor: `${mood.color}35`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{mood.emoji}</span>
                        <span
                          className="font-sans font-bold text-xs uppercase tracking-wider"
                          style={{ color: mood.color }}
                        >
                          {mood.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans font-medium text-[#6b665c]">
                        {Math.round(mood.score * 100)}% valence
                      </span>
                    </div>
                    <p className="text-xs font-serif italic text-[#4a453e] leading-snug">
                      "{mood.summary}"
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-[#fdfcfb] rounded-sm border border-[#e5e1da] text-xs font-serif text-[#a8a297] italic">
                    Click "Detect Mood" or reflect with Gemini to evaluate emotional sentiment.
                  </div>
                )}
              </div>

              {/* Pinned Location Card */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-sans font-bold uppercase text-[#1a1a1a]">
                    Pinned Location
                  </p>
                  {location && (
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                  )}
                </div>
                {location ? (
                  <div className="p-3 rounded-sm border border-[#e5e1da] bg-[#fdfcfb] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-serif font-medium text-[#1a1a1a]">
                            {location.name}
                          </p>
                          {location.address && (
                            <p className="text-[11px] text-[#6b665c] font-sans">
                              {location.address}
                            </p>
                          )}
                          <p className="text-[10px] font-mono text-[#a8a297] mt-0.5">
                            {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-[#f0ece1]">
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className="text-[11px] font-sans text-amber-800 hover:text-amber-950 underline cursor-pointer"
                      >
                        Change on Map
                      </button>
                      <span className="text-[#dcd6c9]">·</span>
                      <button
                        type="button"
                        onClick={() => handleSaveLocation(undefined)}
                        className="text-[11px] font-sans text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="w-full p-2.5 rounded-sm border border-dashed border-[#dcd6c9] hover:border-[#1a1a1a] bg-[#fdfcfb] hover:bg-[#f7f5f0] text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-sans text-[#6b665c] group-hover:text-[#1a1a1a]">
                      <MapPin className="w-3.5 h-3.5 text-[#a8a297] group-hover:text-[#1a1a1a]" />
                      <span>Attach a location pin...</span>
                    </div>
                  </button>
                )}
              </div>

              <div>
                <p className="text-[11px] font-sans font-bold uppercase mb-1 text-[#1a1a1a]">
                  Active Mode
                </p>
                <p className="text-sm text-[#4a453e] font-serif capitalize">
                  {mode.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-sans font-bold uppercase mb-1 text-[#1a1a1a]">
                  Gemini Insight
                </p>
                <p className="text-sm italic leading-snug text-[#1a1a1a] font-serif">
                  {latestGeminiTurn
                    ? `"${stripMarkdown(latestGeminiTurn.text).slice(0, 140)}..."`
                    : '"Every reflection is an exercise in truth-seeking, untangling raw observation from narrative noise."'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#e5e1da]">
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#a8a297] mb-6">
              Session Security
            </h3>
            <div className="flex items-center gap-2 text-xs font-sans text-[#6b665c] mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Firestore Encryption Active</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#a8a297] font-sans">
              This data is strictly isolated to UserID: {userId.slice(0, 10)}... Cross-tenant access is disabled at the security rule level.
            </p>
          </div>
        </div>
      </aside>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onSaveLocation={handleSaveLocation}
      />
    </div>
  );
};
