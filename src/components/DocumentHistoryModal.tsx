import React from 'react';
import { X, FileText, Download, Trash2, Calendar } from 'lucide-react';
import type { DocumentInfo } from '../types';

interface DocumentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentInfo[];
  onSelectDocument: (doc: DocumentInfo) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentHistoryModal: React.FC<DocumentHistoryModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDocument,
  onDeleteDocument,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#200b24]/85 backdrop-blur-md animate-fadeIn text-[#FFFFC5]">
      <div className="bg-[#341539] rounded-3xl shadow-2xl max-w-2xl w-full border border-[rgba(255,255,197,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,197,0.18)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <div>
            <h3 className="text-lg font-bold text-[#FFFFC5] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFFFC5]" />
              Document Library
            </h3>
            <p className="text-xs text-[rgba(255,255,197,0.65)] mt-0.5">
              Your signed documents and tamper-evident audit certificates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgba(255,255,197,0.6)] hover:text-[#FFFFC5] rounded-full hover:bg-[rgba(255,255,197,0.1)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-[rgba(255,255,197,0.6)]">
              <FileText className="w-12 h-12 mx-auto mb-3 stroke-1 text-[rgba(255,255,197,0.4)]" />
              <p className="text-sm font-bold text-[#FFFFC5]">No documents signed yet</p>
              <p className="text-xs mt-1 text-[rgba(255,255,197,0.6)]">
                Upload a PDF document to place your handwritten signature and sign!
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-[rgba(255,255,197,0.04)] border border-[rgba(255,255,197,0.18)] hover:border-[#FFFFC5] rounded-2xl transition shadow-sm hover:shadow flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.25)] text-[#FFFFC5] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#FFFFC5] truncate">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-[rgba(255,255,197,0.65)] mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {doc.createdAt}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#FFFFC5]">
                        {doc.status === 'completed' ? 'Completed & Sealed' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {doc.signedPdfBytes && (
                    <button
                      onClick={() => {
                        const blob = new Blob([doc.signedPdfBytes!.buffer as ArrayBuffer], {
                          type: 'application/pdf',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.title}_Signed.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.15)] rounded-full border border-[rgba(255,255,197,0.2)] transition"
                      title="Download Signed PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onSelectDocument(doc);
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] rounded-full transition shadow-sm"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 text-[rgba(255,255,197,0.6)] hover:text-red-400 hover:bg-[rgba(255,255,197,0.08)] rounded-full transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[rgba(255,255,197,0.15)] flex justify-end bg-[rgba(255,255,197,0.02)]">
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-[#FFFFC5] border border-[rgba(255,255,197,0.3)] hover:bg-[rgba(255,255,197,0.1)] rounded-full transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
