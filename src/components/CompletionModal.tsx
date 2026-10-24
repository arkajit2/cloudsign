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
      // Fire celebratory confetti cannons in Fraoula cream & warm gold colors!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFC5', '#ffd700', '#fef08a', '#e2e8f0'],
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
    link.download = `${documentTitle.replace(/\s+/g, '_')}_Signed.pdf`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#200b24]/85 backdrop-blur-md animate-fadeIn text-[#FFFFC5]">
      <div className="bg-[#341539] rounded-3xl shadow-2xl max-w-xl w-full border border-[rgba(255,255,197,0.25)] overflow-hidden flex flex-col">
        {/* Header Ribbon */}
        <div className="p-8 text-center text-[#FFFFC5] border-b border-[rgba(255,255,197,0.18)] bg-[rgba(255,255,197,0.04)] relative">
          <div className="w-16 h-16 bg-[#FFFFC5] text-[#341539] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#FFFFC5]">Document Completed!</h2>
          <p className="text-[rgba(255,255,197,0.7)] text-xs mt-1">
            Successfully signed and sealed with a tamper-evident cryptographic certificate
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-[rgba(255,255,197,0.04)] rounded-2xl border border-[rgba(255,255,197,0.18)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,197,0.65)] font-medium">Document Title:</span>
              <span className="font-bold text-[#FFFFC5] truncate max-w-[280px]">
                {documentTitle}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,197,0.65)] font-medium">Envelope ID:</span>
              <div className="flex items-center gap-1.5 font-mono text-[#FFFFC5] bg-[rgba(52,21,57,0.8)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,197,0.2)]">
                <span>{envelopeId}</span>
                <button
                  onClick={() => copyToClipboard(envelopeId)}
                  className="hover:text-white transition"
                  title="Copy Envelope ID"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,197,0.65)] font-medium">Signed SHA-256:</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#FFFFC5] bg-[rgba(52,21,57,0.8)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,197,0.2)] max-w-[280px] truncate">
                <span>{signedHash.slice(0, 16)}...{signedHash.slice(-8)}</span>
                <button
                  onClick={() => copyToClipboard(signedHash)}
                  className="hover:text-white transition shrink-0"
                  title="Copy Full Hash"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,197,0.15)] text-[11px] text-[#FFFFC5] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#FFFFC5] shrink-0" />
              <span>ESIGN & UETA Certificate Appended</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={downloadSignedPdf}
              className="w-full py-3.5 px-4 rounded-full text-sm font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] shadow-[0_4px_20px_rgba(255,255,197,0.25)] hover:shadow-[0_8px_30px_rgba(255,255,197,0.4)] hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Download Signed PDF Document
            </button>

            <button
              onClick={onViewAuditTrail}
              className="w-full py-3 px-4 rounded-full text-xs font-bold text-[#FFFFC5] bg-transparent hover:bg-[rgba(255,255,197,0.08)] border border-[rgba(255,255,197,0.35)] hover:border-[#FFFFC5] transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#FFFFC5]" />
              View Tamper-Evident Audit Certificate
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,197,0.15)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <button
            onClick={onSignAnother}
            className="text-xs text-[#FFFFC5] font-bold flex items-center gap-1.5 hover:underline transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sign Another Document
          </button>

          <button
            onClick={onClose}
            className="text-xs text-[rgba(255,255,197,0.7)] hover:text-[#FFFFC5] font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
