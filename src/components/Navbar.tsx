import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, Sparkles, History } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { TestWalkthroughModal } from './TestWalkthroughModal';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onToggleHistory,
  isHistoryOpen,
  historyCount,
}) => {
  return (
    <header className="w-full px-4 sm:px-8 lg:px-10 py-4 sm:py-5 flex justify-between items-center border-b border-[#e5e1da] bg-[#fdfcfb] sticky top-0 z-30">
      {/* Brand identity - Editorial Style */}
      <div className="flex items-baseline gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase font-sans text-[#1a1a1a]">
          Gemini
        </h1>
        <span className="hidden sm:inline text-xs sm:text-sm italic text-[#6b665c] font-serif">
          The Refined Journal
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#a8a297] border-l border-[#e5e1da] pl-3">
          <Sparkles className="w-2.5 h-2.5 text-[#1a1a1a]" /> 3.6 Flash
        </span>
      </div>

      {/* Right action controls */}
      <div className="flex items-center gap-2 sm:gap-6 font-sans text-xs uppercase tracking-widest">
        <SecurityBadge userId={user?.uid} />
        <TestWalkthroughModal />

        {user && (
          <>
            <button
              id="btn-toggle-history"
              onClick={onToggleHistory}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-colors cursor-pointer text-xs uppercase tracking-widest ${
                isHistoryOpen
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-transparent text-[#6b665c] hover:text-[#1a1a1a] hover:bg-[#f5f2ee] border-[#e5e1da]'
              }`}
              title="Toggle Archive"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Archive</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-sm ${isHistoryOpen ? 'bg-stone-700 text-white' : 'bg-[#f5f2ee] text-[#1a1a1a]'}`}>
                {historyCount}
              </span>
            </button>

            <div className="h-4 w-px bg-[#e5e1da] hidden sm:block" />

            {/* User Identity Profile - Editorial Minimal */}
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[#e5e1da]">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  className="w-8 h-8 rounded-full border border-[#e5e1da] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[10px] font-sans font-semibold">
                  {user.displayName
                    ? user.displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'ER'}
                </div>
              )}

              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#1a1a1a] truncate max-w-[140px] tracking-normal font-sans">
                  {user.displayName || 'Elena Rostova'}
                </p>
                <p className="text-[10px] text-[#a8a297] truncate max-w-[140px] tracking-normal font-sans">
                  {user.email}
                </p>
              </div>

              <button
                id="btn-signout"
                onClick={onSignOut}
                className="p-1.5 text-[#a8a297] hover:text-[#1a1a1a] hover:bg-[#f5f2ee] rounded-sm transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
