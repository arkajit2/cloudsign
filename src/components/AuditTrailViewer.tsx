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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-docusign-600/30 border border-docusign-500/40 flex items-center justify-center text-docusign-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Certificate of Completion</h3>
              <p className="text-xs text-slate-400">
                Tamper-evident audit trail secured by Cloudflare Edge & D1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-slate-500">Document Subject:</span>
                <p className="font-bold text-slate-800 text-sm">{documentTitle}</p>
              </div>
              <div>
                <span className="text-slate-500">Envelope ID:</span>
                <p className="font-mono text-slate-700 bg-white p-1 rounded border border-slate-200">
                  {envelopeId}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  Completed & Verified
                </span>
              </div>
              <div>
                <span className="text-slate-500">Completed Timestamp:</span>
                <p className="font-mono text-slate-700">{completedAt || new Date().toISOString()} UTC</p>
              </div>
            </div>
          </div>

          {/* Signer Verification Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Signer Record & Identity
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-docusign-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{signerName}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Signature Adopted
                  </span>
                </div>
                <p className="text-slate-500">{signerEmail}</p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    Cloudflare Edge Routing
                  </span>
                  <span>Security Level: Email & Fingerprint Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Hashes */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Cryptographic Integrity Hashes (SHA-256)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                  <Hash className="w-3.5 h-3.5 text-docusign-600" />
                  Original Document Hash
                </div>
                <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                  {originalHash}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Signed Document Hash (with embedded signatures & cert)
                </div>
                <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                  {signedHash}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Events Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Audit Event History
            </h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-docusign-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                    <span>•</span>
                    <span>By: {log.actorName}</span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                      {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ESIGN & UETA Legally Binding Certificate
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
