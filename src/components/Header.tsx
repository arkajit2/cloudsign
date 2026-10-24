import React from 'react';
import { PenLine, PlusCircle, History } from 'lucide-react';

interface HeaderProps {
  onNewDocument: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDocument,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="h-16 bg-[#341539] border-b border-[rgba(255,255,197,0.18)] px-6 flex items-center justify-between text-[#FFFFC5] shrink-0 sticky top-0 z-30 shadow-lg shadow-black/20">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#FFFFC5] p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-[#341539] rounded-[14px] flex items-center justify-center">
            <PenLine className="w-5 h-5 text-[#FFFFC5]" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-[#FFFFC5]">
              CloudSign
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] border border-[rgba(255,255,197,0.2)] rounded-full">
              Secure
            </span>
          </div>
          <p className="text-[11px] text-[rgba(255,255,197,0.65)] font-medium">
            Electronic Document Signing & Verification
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenHistory}
          className="px-4 py-1.5 text-xs font-semibold text-[#FFFFC5] bg-[rgba(255,255,197,0.06)] hover:bg-[rgba(255,255,197,0.12)] border border-[rgba(255,255,197,0.25)] hover:border-[rgba(255,255,197,0.5)] rounded-full transition flex items-center gap-2"
        >
          <History className="w-3.5 h-3.5 text-[#FFFFC5]" />
          <span>Documents</span>
          {historyCount > 0 && (
            <span className="w-4 h-4 bg-[#FFFFC5] text-[#341539] text-[10px] font-extrabold rounded-full flex items-center justify-center">
              {historyCount}
            </span>
          )}
        </button>

        <button
          onClick={onNewDocument}
          className="px-5 py-1.5 text-xs font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] rounded-full shadow-[0_4px_16px_rgba(255,255,197,0.25)] hover:shadow-[0_6px_24px_rgba(255,255,197,0.4)] hover:-translate-y-0.5 transition flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>
    </header>
  );
};
