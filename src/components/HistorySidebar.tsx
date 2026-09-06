import React, { useState } from 'react';
import { JournalInteraction, ReflectionMode } from '../types';
import { Search, Plus, Trash2, X, Sparkles, Heart } from 'lucide-react';

interface HistorySidebarProps {
  entries: JournalInteraction[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalInteraction) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  onAnalyzeMood?: (entry: JournalInteraction) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onAnalyzeMood,
  isOpen,
  onClose,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingMoodId, setAnalyzingMoodId] = useState<string | null>(null);

  // Extract unique moods for quick filtering
  const availableMoods = Array.from(
    new Set(
      entries
        .map(e => e.mood?.label)
        .filter((label): label is string => Boolean(label))
    )
  );

  const filteredEntries = entries.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entryText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.mood?.label && item.mood.label.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    const matchesMood = filterMood === 'all' || item.mood?.label === filterMood;
    return matchesSearch && matchesMode && matchesMood;
  });

  const handleTriggerAnalyzeMood = async (e: React.MouseEvent, entry: JournalInteraction) => {
    e.stopPropagation();
    if (!onAnalyzeMood || analyzingMoodId) return;
    setAnalyzingMoodId(entry.id);
    try {
      await onAnalyzeMood(entry);
    } finally {
      setAnalyzingMoodId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date
        .toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
        .toUpperCase();
    } catch {
      return 'RECENT';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:relative lg:inset-auto flex">
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-[#1a1a1a]/30 backdrop-blur-xs lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar container - Editorial Archive */}
      <aside className="relative z-50 w-72 sm:w-80 h-full bg-[#fdfcfb] border-r border-[#e5e1da] flex flex-col p-6 sm:p-7 shadow-lg lg:shadow-none">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#a8a297]">
              Archive
            </h3>
            <p className="text-xs font-serif italic text-[#6b665c] mt-0.5">
              {entries.length} {entries.length === 1 ? 'record' : 'records'} indexed
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-new-entry-history"
              onClick={() => {
                onNewEntry();
                if (window.innerWidth < 1024) onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-white bg-[#1a1a1a] hover:bg-black rounded-sm transition-colors cursor-pointer"
              title="Draft New Reflection"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-[#a8a297] hover:text-[#1a1a1a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#a8a297] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search archive or mood..."
              className="w-full pl-8 pr-3 py-1.5 font-sans text-xs bg-[#f5f2ee] border border-[#e5e1da] rounded-sm focus:outline-none focus:border-[#1a1a1a] text-[#1a1a1a] placeholder-[#a8a297]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-sans uppercase tracking-wider custom-scrollbar">
            {['all', 'reflection', 'summary', 'brainstorm', 'deep_dive'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-2 py-0.5 rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                  filterMode === m
                    ? 'bg-[#1a1a1a] text-white font-medium'
                    : 'bg-[#f5f2ee] text-[#6b665c] hover:bg-[#e5e1da]'
                }`}
              >
                {m === 'deep_dive' ? 'Deep' : m}
              </button>
            ))}
          </div>

          {availableMoods.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-sans custom-scrollbar">
              <span className="text-[#a8a297] text-[9px] uppercase tracking-wider shrink-0 mr-1">Mood:</span>
              <button
                onClick={() => setFilterMood('all')}
                className={`px-1.5 py-0.5 rounded-xs text-[9px] uppercase tracking-wider transition-colors cursor-pointer ${
                  filterMood === 'all'
                    ? 'bg-[#1a1a1a] text-white font-semibold'
                    : 'bg-[#f5f2ee] text-[#6b665c] hover:bg-[#e5e1da]'
                }`}
              >
                All
              </button>
              {availableMoods.map(m => {
                const sampleEntry = entries.find(e => e.mood?.label === m);
                return (
                  <button
                    key={m}
                    onClick={() => setFilterMood(filterMood === m ? 'all' : m)}
                    className={`px-1.5 py-0.5 rounded-xs text-[9px] whitespace-nowrap flex items-center gap-1 transition-colors cursor-pointer ${
                      filterMood === m
                        ? 'bg-[#1a1a1a] text-white font-semibold'
                        : 'bg-[#f5f2ee] text-[#6b665c] hover:bg-[#e5e1da]'
                    }`}
                  >
                    {sampleEntry?.mood?.emoji && <span>{sampleEntry.mood.emoji}</span>}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Archive List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-36 text-[#a8a297] text-xs font-sans">
              <div className="w-4 h-4 border-2 border-[#e5e1da] border-t-[#1a1a1a] rounded-full animate-spin mb-2" />
              <span className="uppercase tracking-widest text-[10px]">Accessing Archive...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-10 px-2 text-[#a8a297] font-serif italic text-xs">
              <p className="text-[#6b665c]">No entries found in archive.</p>
              <p className="text-[11px] mt-1">Begin writing to populate your chronicle.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredEntries.map(entry => {
                const isActive = entry.id === activeEntryId;
                const isDeleting = deletingId === entry.id;

                return (
                  <li
                    key={entry.id}
                    onClick={() => {
                      onSelectEntry(entry);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group cursor-pointer transition-all pb-3 border-b border-[#e5e1da]/60 ${
                      isActive ? 'opacity-100 pl-2 border-l-2 border-[#1a1a1a]' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Visual Mood Indicator */}
                        {entry.mood ? (
                          <div
                            id={`mood-indicator-${entry.id}`}
                            className="shrink-0 flex items-center justify-center w-5 h-5 rounded-xs border text-xs mt-0.5 transition-transform group-hover:scale-110 shadow-2xs"
                            style={{
                              backgroundColor: `${entry.mood.color}15`,
                              borderColor: `${entry.mood.color}40`,
                              color: entry.mood.color,
                            }}
                            title={`Detected Mood: ${entry.mood.label} • ${entry.mood.summary}`}
                          >
                            <span className="text-[12px] leading-none select-none">{entry.mood.emoji}</span>
                          </div>
                        ) : (
                          <div
                            className="shrink-0 w-2 h-2 rounded-full bg-[#e5e1da] mt-1.5 ml-1 mr-1"
                            title="Mood unanalyzed"
                          />
                        )}
                        <p className="text-sm font-serif leading-tight text-[#1a1a1a] group-hover:underline line-clamp-2">
                          {entry.title || 'Untitled Reflection'}
                        </p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (isDeleting) {
                            onDeleteEntry(entry.id);
                            setDeletingId(null);
                          } else {
                            setDeletingId(entry.id);
                          }
                        }}
                        className={`text-[10px] font-sans uppercase tracking-wider p-0.5 rounded-sm transition-colors ${
                          isDeleting
                            ? 'bg-rose-100 text-rose-800 font-bold px-1'
                            : 'text-[#a8a297] hover:text-rose-700 opacity-0 group-hover:opacity-100'
                        }`}
                        title={isDeleting ? 'Click to confirm deletion' : 'Delete entry'}
                      >
                        {isDeleting ? 'Delete?' : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 font-sans text-[10px] tracking-widest uppercase text-[#a8a297]">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(entry.createdAt)}</span>
                        {entry.mood ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[9px] font-sans font-medium capitalize"
                            style={{
                              backgroundColor: `${entry.mood.color}15`,
                              color: entry.mood.color,
                            }}
                            title={entry.mood.summary}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: entry.mood.color }}
                            />
                            <span>{entry.mood.label}</span>
                          </span>
                        ) : (
                          onAnalyzeMood && (
                            <button
                              onClick={e => handleTriggerAnalyzeMood(e, entry)}
                              disabled={analyzingMoodId === entry.id}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-sans uppercase tracking-wider text-[#6b665c] hover:text-[#1a1a1a] flex items-center gap-1 cursor-pointer"
                              title="Analyze mood sentiment with Gemini"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{analyzingMoodId === entry.id ? 'Analyzing...' : 'Mood'}</span>
                            </button>
                          )
                        )}
                      </div>
                      <span className="text-[9px] text-[#6b665c]">
                        {entry.turns?.length || 1} {(entry.turns?.length || 1) === 1 ? 'Turn' : 'Turns'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Storage Status - Editorial Style from Design */}
        <div className="mt-auto pt-6">
          <div className="p-4 bg-[#f5f2ee] rounded-sm border border-[#e5e1da]">
            <h4 className="font-sans text-[9px] uppercase tracking-widest text-[#6b665c] mb-2 font-bold">
              Storage Status
            </h4>
            <div className="w-full h-[2px] bg-[#e5e1da] mb-2">
              <div
                className="h-full bg-[#1a1a1a]"
                style={{
                  width: `${Math.min(Math.max((entries.length / 50) * 100, 8), 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-sans text-[#a8a297]">
              <span>Firestore Partition</span>
              <span>Active Encryption</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
