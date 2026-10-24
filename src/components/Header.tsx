import React from 'react';
import { PenLine, Cloud, Shield, PlusCircle, History, BookOpen, GitBranch } from 'lucide-react';

interface HeaderProps {
  onNewDocument: () => void;
  onOpenHistory: () => void;
  onOpenArchitecture: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDocument,
  onOpenHistory,
  onOpenArchitecture,
  historyCount,
}) => {
  return (
    <header className="h-16 bg-navy-950 border-b border-navy-800 px-6 flex items-center justify-between text-white shrink-0 sticky top-0 z-30 shadow-md">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-docusign-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-docusign-500/20">
          <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
            <PenLine className="w-5 h-5 text-docusign-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              CloudSign
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-docusign-500/20 text-docusign-400 border border-docusign-500/30 rounded">
                Cloudflare
              </span>
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Next-Gen eSignatures • Pages, R2 & D1 Architecture
          </p>
        </div>
      </div>

      {/* Cloudflare Stack Badges */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1 px-2.5 py-1 bg-navy-900 border border-navy-800 rounded-full">
          <Cloud className="w-3 h-3 text-orange-400" />
          Pages + Functions
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 bg-navy-900 border border-navy-800 rounded-full">
          <Shield className="w-3 h-3 text-cyan-400" />
          R2 Storage & D1 SQLite
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 bg-navy-900 border border-navy-800 rounded-full">
          <GitBranch className="w-3 h-3 text-emerald-400" />
          GitHub Actions CI/CD
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenArchitecture}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-navy-900 hover:bg-navy-800 border border-navy-800 rounded-lg transition flex items-center gap-1.5"
          title="Cloudflare Architecture & CI/CD Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-docusign-400" />
          <span className="hidden sm:inline">Cloudflare Setup</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-navy-900 hover:bg-navy-800 border border-navy-800 rounded-lg transition flex items-center gap-1.5 relative"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Documents</span>
          {historyCount > 0 && (
            <span className="w-4 h-4 bg-docusign-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center">
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={onNewDocument}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-docusign-600 hover:bg-docusign-500 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Upload PDF</span>
        </button>
      </div>
    </header>
  );
};
