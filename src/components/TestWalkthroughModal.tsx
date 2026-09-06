import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, TestTube2, X } from 'lucide-react';

export const TestWalkthroughModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  const testCases = [
    {
      id: 'TC-AUTH-01',
      title: 'Google Federated Authentication & Session Persistence',
      category: 'User Identity',
      steps: [
        'Navigate to the landing page while unauthenticated.',
        'Click the "Continue with Google" button.',
        'Complete the Google Sign-In popup with valid Google account credentials.',
        'Verify immediate redirect to private Dashboard with user profile avatar, name, and email populated in the navigation bar.',
        'Refresh the page and confirm the session persists seamlessly via onAuthStateChanged without re-prompting.',
        'Click "Sign Out" and verify the session terminates, returning strictly to the landing view.',
      ],
      expectedResult: 'Authentication succeeds without password handling; private dashboard renders only when request.auth != null.',
    },
    {
      id: 'TC-JOURNAL-02',
      title: 'Journal Entry Creation & Mode Selection',
      category: 'Reflection Workspace',
      steps: [
        'From the private dashboard, enter a descriptive title (e.g., "The Weight of Morning Fog").',
        'Select a reflection mode: "Mindful Reflection", "Executive Summary", "Creative Brainstorming", or "Deep-Dive Inquiry".',
        'Draft a reflection or journal entry in the writing canvas.',
        'Observe live word count and character count updating synchronously.',
        'Click "Submit Entry" or "Reflect with Gemini".',
        'Verify the loading state activates with responsive status messaging.',
      ],
      expectedResult: 'Input is validated; server endpoint receives payload; Gemini generates contextual reflection.',
    },
    {
      id: 'TC-GEMINI-03',
      title: 'Gemini 3.6 Flash Fallback Ladder & Multi-Turn Conversation',
      category: 'AI Processing Engine',
      steps: [
        'Inspect server logs or network tab during reflection generation.',
        'Verify request routes to POST /api/gemini/reflect with User-Agent "aistudio-build".',
        'Verify model fallback ladder attempts gemini-3.6-flash, with automatic failover to gemini-3.1-flash-lite if rate limits occur.',
        'Review the rendered Gemini AI response formatted in italic editorial serif.',
        'Type a follow-up prompt in the multi-turn conversational reply box and click "Submit Entry".',
        'Confirm the full conversation thread maintains context history and appends turns sequentially.',
      ],
      expectedResult: 'Multi-turn conversation flows naturally; Gemini responses adapt precisely to the chosen reflection mode.',
    },
    {
      id: 'TC-STORAGE-04',
      title: 'Firestore User-Isolated Document Persistence',
      category: 'Database & Security',
      steps: [
        'Verify entry persistence to /users/{userId}/interactions/{interactionId}.',
        'Observe the storage indicator in the archive sidebar.',
        'Open the "Archive" panel from the left sidebar or top toggle.',
        'Verify the newly created entry appears at the top with publication date and title.',
        'Click a historical entry to load it back into the active editor canvas with all conversation turns intact.',
      ],
      expectedResult: 'Interaction documents are strictly scoped to the authenticated user UID with verified zero-crash payload sanitization.',
    },
    {
      id: 'TC-CROSS-TENANT-05',
      title: 'Cross-User Data Isolation Verification',
      category: 'Zero-Trust ABAC',
      steps: [
        'Log in as User A, create an entry with a unique test title.',
        'Sign out from User A and sign in as User B (a different Google account).',
        'Check the Archive panel for User B.',
        'Verify that none of User A’s entries are visible or queried.',
        'Attempt direct path read of User A’s document ID via console: should trigger PERMISSION_DENIED handled by handleFirestoreError.',
      ],
      expectedResult: 'Deterministic Firestore Security Rules completely block unauthorized cross-tenant data exposure.',
    },
    {
      id: 'TC-RESILIENCE-06',
      title: 'Persistence Verification & Zero-Data-Loss Error Recovery',
      category: 'Functional Stability',
      steps: [
        'Simulate an offline or network interruption during reflection submission.',
        'Observe that user input is never cleared or discarded upon error.',
        'Verify the display of an explicit error notification with a "Retry Save" option.',
        'Restore connection and click "Retry Save".',
        'Confirm document persistence succeeds and the interaction is saved cleanly.',
      ],
      expectedResult: 'Zero data loss; clear user feedback; transactional input-to-save verification upheld.',
    },
  ];

  return (
    <>
      <button
        id="btn-open-walkthrough"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#6b665c] bg-[#f5f2ee] hover:bg-[#e5e1da]/50 border border-[#e5e1da] rounded-sm transition-colors cursor-pointer"
        title="View Functional Stability Walkthrough & Test Suite"
      >
        <TestTube2 className="w-3 h-3 text-[#1a1a1a]" />
        <span className="hidden sm:inline">Walkthrough</span>
        <span className="bg-[#e5e1da] text-[#1a1a1a] text-[9px] font-bold px-1.5 py-0.2 rounded-xs">6 Suites</span>
      </button>

      {isOpen && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1a1a1a]/40 backdrop-blur-xs"
        >
          <div className="bg-[#fdfcfb] rounded-sm max-w-2xl w-full max-h-[88vh] sm:max-h-[85vh] flex flex-col min-h-0 shadow-2xl border border-[#e5e1da] overflow-hidden">
            <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#e5e1da] bg-[#fdfcfb] shrink-0">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a8a297] block mb-1">
                  Quality Assurance
                </span>
                <h3 className="text-xl font-normal text-[#1a1a1a] font-serif italic">
                  Verification Walkthrough
                </h3>
                <p className="text-xs text-[#6b665c] font-sans mt-0.5">
                  Standardized test procedures for automated scripts & human verification
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#a8a297] hover:text-[#1a1a1a] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Case Selection Tabs - Clean wrapping layout preventing scrollbar clipping */}
            <div className="border-b border-[#e5e1da] bg-[#f5f2ee] p-3 shrink-0">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {testCases.map((tc, idx) => (
                  <button
                    key={tc.id}
                    id={`btn-tab-${tc.id.toLowerCase()}`}
                    onClick={() => setActiveTab(idx)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xs text-[11px] font-sans tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === idx
                        ? 'bg-[#1a1a1a] text-white font-semibold shadow-xs'
                        : 'text-[#6b665c] bg-white/70 hover:bg-white hover:text-[#1a1a1a] border border-[#e5e1da]/60'
                    }`}
                  >
                    <span className="font-mono text-[10px]">{tc.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body - Fixed height containment with min-h-0 and full scrollability */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
              {testCases[activeTab] && (
                <div className="space-y-5">
                  {/* Test Case Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#e5e1da] pb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a8a297] block mb-1">
                        {testCases[activeTab].category}
                      </span>
                      <h4 className="text-base sm:text-lg font-medium text-[#1a1a1a] font-serif leading-snug break-words">
                        {testCases[activeTab].title}
                      </h4>
                    </div>
                    <span className="inline-block shrink-0 px-2 py-0.5 rounded-xs bg-[#f5f2ee] border border-[#e5e1da] text-[10px] font-mono font-medium text-[#1a1a1a] self-start">
                      {testCases[activeTab].id}
                    </span>
                  </div>

                  {/* Verification Procedure Steps */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-sans uppercase tracking-widest text-[#6b665c] font-semibold">
                      Verification Procedure:
                    </p>
                    <ol className="space-y-2.5 font-sans">
                      {testCases[activeTab].steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-3 text-xs text-[#4a453e]">
                          <span className="w-5 h-5 rounded-xs bg-[#f5f2ee] border border-[#e5e1da] text-[#1a1a1a] font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="leading-relaxed flex-1 min-w-0 break-words pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Expected Pass Criteria Block */}
                  <div className="p-4 rounded-sm bg-[#f5f2ee] border border-[#e5e1da] text-xs">
                    <div className="flex items-start gap-3 text-[#1a1a1a]">
                      <CheckCircle2 className="w-4 h-4 text-[#1a1a1a] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-sans font-bold text-[10px] uppercase tracking-wider block mb-1 text-[#1a1a1a]">
                          Expected Pass Result:
                        </span>
                        <p className="text-[#4a453e] leading-relaxed break-words">
                          {testCases[activeTab].expectedResult}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e5e1da] bg-[#f5f2ee] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#a8a297]">
                6 Suites Operational
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 font-sans text-xs uppercase tracking-widest text-white bg-[#1a1a1a] hover:bg-black rounded-sm transition-colors cursor-pointer"
              >
                Close Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
