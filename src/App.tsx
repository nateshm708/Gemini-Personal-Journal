import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, testConnection } from './firebase';
import { JournalInteraction, OperationType } from './types';
import { sanitizePayload } from './utils/sanitize';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalInteraction | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 1. Initial connection verification and auth state listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAuthReady(true);
      setIsSigningIn(false);
      setAuthError(null);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore subscription to user's isolated interactions collection
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    setIsLoadingEntries(true);
    const interactionsPath = `users/${user.uid}/interactions`;
    const interactionsRef = collection(db, 'users', user.uid, 'interactions');

    const unsubscribe = onSnapshot(
      interactionsRef,
      snapshot => {
        const loaded: JournalInteraction[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as JournalInteraction;
          loaded.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Client-side deterministic sorting by updatedAt / createdAt descending
        loaded.sort((a, b) => {
          const timeA = new Date(b.updatedAt || b.createdAt || 0).getTime();
          const timeB = new Date(a.updatedAt || a.createdAt || 0).getTime();
          return timeA - timeB;
        });

        setEntries(loaded);
        setIsLoadingEntries(false);
      },
      error => {
        setIsLoadingEntries(false);
        try {
          handleFirestoreError(error, OperationType.GET, interactionsPath);
        } catch (wrappedErr: any) {
          console.error('Failed to load user interactions:', wrappedErr);
          setSaveError('Failed to synchronize with Firestore database. Please verify network permissions.');
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Sign-In with popup
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Suppress popup cancellation by user
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Failed to complete Google Sign-In. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveEntry(null);
      setEntries([]);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Guaranteed Transaction Persistence: Strict Undefined-Stripping + Zero Input Loss
  const handleSaveInteraction = async (interaction: JournalInteraction): Promise<boolean> => {
    if (!user) {
      setSaveError('You must be signed in to save entries.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    const docPath = `users/${user.uid}/interactions/${interaction.id}`;

    try {
      // 1. Strict undefined-stripping to prevent Firestore driver errors
      const sanitized = sanitizePayload<JournalInteraction>({
        ...interaction,
        userId: user.uid,
      });

      // 2. Commit write directly to the user-isolated document path
      const docRef = doc(db, 'users', user.uid, 'interactions', interaction.id);
      await setDoc(docRef, sanitized, { merge: true });

      // 3. Keep active entry synchronized
      setActiveEntry(sanitized);
      return true;
    } catch (error: any) {
      console.error('Firestore write error:', error);
      let errorMsg = 'Failed to persist entry to Cloud Firestore.';
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch (e: any) {
        errorMsg = `Database write error: ${e.message || 'Permission denied'}`;
      }
      setSaveError(errorMsg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    const docPath = `users/${user.uid}/interactions/${entryId}`;

    try {
      const docRef = doc(db, 'users', user.uid, 'interactions', entryId);
      await deleteDoc(docRef);

      if (activeEntry?.id === entryId) {
        setActiveEntry(null);
      }
    } catch (error: any) {
      console.error('Firestore delete error:', error);
      try {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      } catch (e: any) {
        setSaveError(`Failed to delete entry: ${e.message}`);
      }
    }
  };

  // Analyze mood on-demand for an entry
  const handleAnalyzeMood = async (entry: JournalInteraction) => {
    if (!user || !entry) return;
    const contentToAnalyze =
      entry.entryText ||
      entry.turns?.map(t => t.text).join('\n\n') ||
      entry.title;
    if (!contentToAnalyze.trim()) return;

    try {
      const res = await fetch('/api/gemini/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: contentToAnalyze,
          title: entry.title || 'Journal Entry',
        }),
      });
      if (!res.ok) throw new Error('Sentiment analysis failed');
      const data = await res.json();
      if (data.mood) {
        const updatedEntry: JournalInteraction = {
          ...entry,
          mood: data.mood,
          updatedAt: new Date().toISOString(),
        };
        await handleSaveInteraction(updatedEntry);
      }
    } catch (err: any) {
      console.error('Failed to analyze entry mood:', err);
    }
  };

  // Start a fresh reflection
  const handleNewEntry = () => {
    setActiveEntry(null);
  };

  // Select an existing reflection to view or continue
  const handleSelectEntry = (entry: JournalInteraction) => {
    setActiveEntry(entry);
  };

  // Splash screen while initial Firebase Auth restores
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#e5e1da] border-t-[#1a1a1a] animate-spin" />
          <span className="text-xs font-sans uppercase tracking-widest text-[#a8a297]">
            Accessing Editorial Archive...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1a1a1a] flex flex-col selection:bg-[#e5e1da]">
      {/* Navbar Header */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onToggleHistory={() => setIsHistoryOpen(prev => !prev)}
        isHistoryOpen={isHistoryOpen}
        historyCount={entries.length}
      />

      {/* Main Viewport */}
      {!user ? (
        <main className="flex-1 flex flex-col justify-center">
          <LandingPage
            onSignIn={handleSignIn}
            isSigningIn={isSigningIn}
            error={authError}
          />
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden">
          {/* History Sidebar */}
          <HistorySidebar
            entries={entries}
            activeEntryId={activeEntry?.id || null}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteEntry}
            onAnalyzeMood={handleAnalyzeMood}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            isLoading={isLoadingEntries}
          />

          {/* Active Journal & Reflection Workspace */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <JournalEditor
              key={activeEntry ? activeEntry.id : 'new-entry'}
              initialInteraction={activeEntry}
              onSaveInteraction={handleSaveInteraction}
              isSaving={isSaving}
              saveError={saveError}
              onClearError={() => setSaveError(null)}
              userId={user.uid}
            />
          </div>
        </main>
      )}
    </div>
  );
}
