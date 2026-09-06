import React from 'react';
import { ArrowRight, Lock, Brain, Shield, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isSigningIn: boolean;
  error?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isSigningIn, error }) => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-6 sm:px-10 lg:px-12 py-16 bg-[#fdfcfb]">
      <div className="max-w-3xl w-full text-center space-y-10">
        {/* Editorial Subtitle Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm text-[#6b665c] font-sans text-[10px] uppercase tracking-[0.2em]">
          <span>Issue Nº 01 — The Refined Journal & Gemini 3.6 Flash</span>
        </div>

        {/* Serif Editorial Headline */}
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-6xl font-normal text-[#1a1a1a] font-serif italic tracking-tight leading-[1.15]">
            A quiet sanctuary for your thoughts.
            <br />
            <span className="not-italic text-[#4a453e]">A thoughtful partner for clarity.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#6b665c] max-w-xl mx-auto font-serif leading-relaxed italic">
            Write uninhibited reflections, explore deeper insights through multi-turn dialogue with Gemini, and archive your personal journey with strict zero-knowledge Firestore privacy.
          </p>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="max-w-md mx-auto p-4 bg-[#f5f2ee] border border-rose-300 text-rose-800 text-xs rounded-sm text-left font-sans">
            <span className="font-bold uppercase tracking-wider block mb-1">Authentication Notice:</span>
            {error}
          </div>
        )}

        {/* Sign In CTA - Editorial Solid Black Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="btn-google-signin"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="w-full sm:w-auto px-8 py-4 bg-[#1a1a1a] hover:bg-black text-white font-sans text-xs uppercase tracking-widest flex items-center justify-center gap-4 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isSigningIn ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Opening Google Sign-In...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-[#a8a297]" />
              </>
            )}
          </button>
        </div>

        {/* Three Editorial Architectural Columns */}
        <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="p-6 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-3">
            <div className="w-7 h-7 rounded-sm bg-[#1a1a1a] text-white flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-normal text-[#1a1a1a] font-serif">
              Strict User Isolation
            </h3>
            <p className="text-xs text-[#6b665c] leading-relaxed font-sans">
              Every entry is committed solely under your private <code className="bg-[#e5e1da]/60 px-1 py-0.5 rounded-xs text-[10px] font-mono">/users/{'{uid}'}/interactions</code> path. Protected by native Firestore security rules.
            </p>
          </div>

          <div className="p-6 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-3">
            <div className="w-7 h-7 rounded-sm bg-[#1a1a1a] text-white flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-normal text-[#1a1a1a] font-serif">
              Gemini 3.6 Flash Engine
            </h3>
            <p className="text-xs text-[#6b665c] leading-relaxed font-sans">
              Converse across multiple reflection turns, synthesize core emotional themes, and brainstorm creative actions with server-side proxy protection.
            </p>
          </div>

          <div className="p-6 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-3">
            <div className="w-7 h-7 rounded-sm bg-[#1a1a1a] text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-normal text-[#1a1a1a] font-serif">
              Zero Password Retention
            </h3>
            <p className="text-xs text-[#6b665c] leading-relaxed font-sans">
              Leverages Google Federated Authentication. The application never asks for, handles, or stores email passwords, eliminating credential risks.
            </p>
          </div>
        </div>

        {/* Feature checklist - Editorial Hairline Dividers */}
        <div className="pt-4 border-t border-[#e5e1da] flex flex-wrap items-center justify-center gap-8 text-[11px] font-sans uppercase tracking-widest text-[#a8a297]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-[#1a1a1a]" />
            <span>Multi-turn reflections</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-[#1a1a1a]" />
            <span>Complete archive timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-[#1a1a1a]" />
            <span>Zero data loss transaction guarantees</span>
          </div>
        </div>
      </div>
    </div>
  );
};
