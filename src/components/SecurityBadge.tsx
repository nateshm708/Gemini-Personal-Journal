import React, { useState } from 'react';
import { ShieldCheck, Lock, Database, UserCheck, X } from 'lucide-react';

interface SecurityBadgeProps {
  userId?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        id="btn-security-details"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#6b665c] bg-[#f5f2ee] hover:bg-[#e5e1da]/50 border border-[#e5e1da] rounded-sm transition-colors cursor-pointer"
        title="View Security & Isolation Spec"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
        <span className="hidden sm:inline">Isolation:</span>
        <span className="text-[#1a1a1a] font-semibold">Strict ABAC</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a]/40 backdrop-blur-xs">
          <div className="bg-[#fdfcfb] rounded-sm max-w-lg w-full p-8 shadow-2xl border border-[#e5e1da]">
            <div className="flex items-start justify-between pb-4 border-b border-[#e5e1da]">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a8a297] block mb-1">
                  Session Security
                </span>
                <h3 className="text-xl font-normal text-[#1a1a1a] font-serif italic">
                  Data Isolation & Zero-Trust
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#a8a297] hover:text-[#1a1a1a] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs text-[#4a453e] leading-relaxed">
              <div className="p-4 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-[#1a1a1a]">
                    Partitioned Firestore Storage Path
                  </span>
                </div>
                <p className="text-[#6b665c] font-mono text-[10px] pt-1 break-all">
                  /users/{userId || '{user_uid}'}/interactions/{'{interaction_id}'}
                </p>
                <p className="text-[11px] text-[#4a453e] pt-1">
                  Entries exist solely inside your authenticated UID subtree. Cross-tenant reads are blocked at the Firestore database engine level.
                </p>
              </div>

              <div className="p-4 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-[#1a1a1a]">
                    Deterministic Security Rules
                  </span>
                </div>
                <p className="text-[11px] text-[#4a453e]">
                  Evaluated natively on every read/write: <code className="bg-[#e5e1da]/60 px-1 py-0.5 rounded-xs text-[10px] font-mono">allow read, write: if request.auth.uid == userId;</code> with a global default-deny rule.
                </p>
              </div>

              <div className="p-4 bg-[#f5f2ee] border border-[#e5e1da] rounded-sm space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-[#1a1a1a]">
                    Federated Identity
                  </span>
                </div>
                <p className="text-[11px] text-[#4a453e]">
                  Google Sign-In handles identity securely. No raw passwords or email credentials are ever stored or handled by the application code.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#e5e1da] flex justify-end">
              <button
                id="btn-close-security-modal"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 font-sans text-xs uppercase tracking-widest text-white bg-[#1a1a1a] hover:bg-black rounded-sm transition-colors cursor-pointer"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
