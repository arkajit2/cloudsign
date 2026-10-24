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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-docusign-600" />
              Document Library
            </h3>
            <p className="text-xs text-slate-500">
              Your signed documents and tamper-evident audit certificates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 stroke-1 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No documents signed yet</p>
              <p className="text-xs mt-1">
                Upload a PDF document to place your handwritten signature and sign!
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white border border-slate-200 hover:border-docusign-400 rounded-2xl transition shadow-sm hover:shadow flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      doc.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-docusign-100 text-docusign-600'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {doc.createdAt}
                      </span>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          doc.status === 'completed' ? 'text-emerald-600' : 'text-docusign-600'
                        }`}
                      >
                        {doc.status === 'completed' ? 'Completed & Sealed' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                      className="p-2 text-slate-600 hover:text-docusign-600 hover:bg-docusign-50 rounded-lg transition"
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
                    className="px-3 py-1.5 text-xs font-semibold text-docusign-700 bg-docusign-50 hover:bg-docusign-100 rounded-lg transition"
                  >
                    Open
                  </button>

                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
