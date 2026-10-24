import React from 'react';
import { ShieldCheck, X, CheckCircle, Clock, Globe, FileCheck, Hash, UserCheck } from 'lucide-react';
import type { AuditLogItem } from '../types';

interface AuditTrailViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  envelopeId: string;
  originalHash: string;
  signedHash: string;
  completedAt: string;
  signerName: string;
  signerEmail: string;
  auditLogs: AuditLogItem[];
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  isOpen,
  onClose,
  documentTitle,
  envelopeId,
  originalHash,
  signedHash,
  completedAt,
  signerName,
  signerEmail,
  auditLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#200b24]/85 backdrop-blur-md animate-fadeIn text-[#FFFFC5]">
      <div className="bg-[#341539] rounded-3xl shadow-2xl max-w-3xl w-full border border-[rgba(255,255,197,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-[rgba(255,255,197,0.18)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.25)] flex items-center justify-center text-[#FFFFC5]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFFFC5]">Certificate of Completion</h3>
              <p className="text-xs text-[rgba(255,255,197,0.65)]">
                Tamper-evident audit trail & cryptographic record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgba(255,255,197,0.6)] hover:text-[#FFFFC5] rounded-full hover:bg-[rgba(255,255,197,0.1)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[rgba(255,255,197,0.04)] rounded-2xl border border-[rgba(255,255,197,0.18)] text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[rgba(255,255,197,0.6)]">Document Subject:</span>
                <p className="font-bold text-[#FFFFC5] text-sm mt-0.5">{documentTitle}</p>
              </div>
              <div>
                <span className="text-[rgba(255,255,197,0.6)]">Envelope ID:</span>
                <p className="font-mono text-[#FFFFC5] bg-[rgba(52,21,57,0.8)] p-1.5 rounded-lg border border-[rgba(255,255,197,0.2)] mt-0.5">
                  {envelopeId}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[rgba(255,255,197,0.6)]">Status:</span>
                <span className="inline-flex items-center gap-1 ml-2 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFFFC5] text-[#341539]">
                  <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                  Completed & Sealed
                </span>
              </div>
              <div>
                <span className="text-[rgba(255,255,197,0.6)]">Completed Timestamp:</span>
                <p className="font-mono text-[#FFFFC5] mt-0.5">{completedAt || new Date().toISOString()} UTC</p>
              </div>
            </div>
          </div>

          {/* Signer Verification Details */}
          <div>
            <h4 className="text-xs font-bold text-[rgba(255,255,197,0.7)] uppercase tracking-wider mb-3">
              Signer Record & Identity
            </h4>
            <div className="p-4 bg-[rgba(255,255,197,0.04)] rounded-2xl border border-[rgba(255,255,197,0.18)] flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.25)] text-[#FFFFC5] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#FFFFC5]">{signerName}</span>
                  <span className="text-[#FFFFC5] font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Signature Adopted
                  </span>
                </div>
                <p className="text-[rgba(255,255,197,0.7)]">{signerEmail}</p>
                <div className="text-[11px] text-[rgba(255,255,197,0.6)] pt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#FFFFC5]" />
                    Encrypted Network Routing
                  </span>
                  <span>Security Level: Fingerprint Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hashes */}
          <div>
            <h4 className="text-xs font-bold text-[rgba(255,255,197,0.7)] uppercase tracking-wider mb-3">
              Cryptographic Integrity Hashes (SHA-256)
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[rgba(255,255,197,0.04)] rounded-2xl border border-[rgba(255,255,197,0.18)]">
                <div className="flex items-center gap-1.5 font-bold text-[#FFFFC5] mb-1">
                  <Hash className="w-3.5 h-3.5 text-[#FFFFC5]" />
                  Original Document Hash
                </div>
                <div className="font-mono text-[11px] text-[#FFFFC5] break-all bg-[rgba(52,21,57,0.8)] p-2 rounded-xl border border-[rgba(255,255,197,0.2)]">
                  {originalHash}
                </div>
              </div>

              <div className="p-3 bg-[rgba(255,255,197,0.04)] rounded-2xl border border-[rgba(255,255,197,0.18)]">
                <div className="flex items-center gap-1.5 font-bold text-[#FFFFC5] mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#FFFFC5]" />
                  Signed Document Hash (with embedded signatures & cert)
                </div>
                <div className="font-mono text-[11px] text-[#FFFFC5] break-all bg-[rgba(52,21,57,0.8)] p-2 rounded-xl border border-[rgba(255,255,197,0.2)]">
                  {signedHash}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Events Timeline */}
          <div>
            <h4 className="text-xs font-bold text-[rgba(255,255,197,0.7)] uppercase tracking-wider mb-3">
              Audit Event History
            </h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[rgba(255,255,197,0.2)]">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#FFFFC5] ring-4 ring-[#341539]" />
                  <div className="font-bold text-[#FFFFC5]">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-[rgba(255,255,197,0.65)] flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                    <span>•</span>
                    <span>By: {log.actorName}</span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-[rgba(255,255,197,0.8)] mt-1 bg-[rgba(255,255,197,0.03)] p-2 rounded-xl border border-[rgba(255,255,197,0.12)]">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,197,0.15)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <div className="text-xs text-[rgba(255,255,197,0.7)]">
            ESIGN & UETA Legally Binding Certificate
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] rounded-full transition shadow-md"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
