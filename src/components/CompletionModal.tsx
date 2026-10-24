import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, ShieldCheck, Copy, RotateCcw } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  envelopeId: string;
  originalHash?: string;
  signedHash: string;
  signedPdfBytes: Uint8Array | null;
  onViewAuditTrail: () => void;
  onSignAnother: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  envelopeId,
  signedHash,
  signedPdfBytes,
  onViewAuditTrail,
  onSignAnother,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti cannons!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0e8ce6', '#10b981', '#3b82f6', '#f59e0b'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadSignedPdf = () => {
    if (!signedPdfBytes) return;
    const blob = new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '_')}_Signed_CloudSign.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <CheckCircle2 className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Document Completed!</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Successfully signed and stamped with Cloudflare tamper-evident certificate
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Document Title:</span>
              <span className="font-bold text-slate-800 truncate max-w-[280px]">
                {documentTitle}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Envelope ID:</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                <span>{envelopeId}</span>
                <button
                  onClick={() => copyToClipboard(envelopeId)}
                  className="hover:text-docusign-600 transition"
                  title="Copy Envelope ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Signed SHA-256:</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[280px] truncate">
                <span>{signedHash.slice(0, 16)}...{signedHash.slice(-8)}</span>
                <button
                  onClick={() => copyToClipboard(signedHash)}
                  className="hover:text-docusign-600 transition shrink-0"
                  title="Copy Full Hash"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>DocuSign ESIGN & UETA Certificate Appended</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={downloadSignedPdf}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-docusign-600 to-docusign-700 hover:from-docusign-700 hover:to-docusign-800 shadow-lg shadow-docusign-500/25 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Download Signed PDF Document
            </button>

            <button
              onClick={onViewAuditTrail}
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              View Tamper-Evident Audit Certificate
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onSignAnother}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sign Another Document
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
