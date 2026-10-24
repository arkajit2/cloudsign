import React, { useState } from 'react';
import { UploadCloud, FileText, ShieldCheck, Zap, Lock, CheckCircle2 } from 'lucide-react';
import { computeSha256 } from '../utils/crypto';
import { createSampleAgreementPdf } from '../utils/samplePdf';

interface DocumentUploaderProps {
  onDocumentLoaded: (fileData: {
    title: string;
    pdfBytes: Uint8Array;
    sha256Hash: string;
    fileSize: number;
  }) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDocumentLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const processPdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage('Computing cryptographic SHA-256 fingerprint...');
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const hash = await computeSha256(bytes);

      onDocumentLoaded({
        title: file.name.replace(/\.[^/.]+$/, ''),
        pdfBytes: bytes,
        sha256Hash: hash,
        fileSize: file.size,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF file. Please ensure it is not password protected.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processPdfFile(e.target.files[0]);
    }
  };

  const handleLoadSampleAgreement = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Generating sample legal NDA agreement...');
      const sampleBytes = await createSampleAgreementPdf();
      const hash = await computeSha256(sampleBytes);

      onDocumentLoaded({
        title: 'Mutual Non-Disclosure Agreement (NDA)',
        pdfBytes: sampleBytes,
        sha256Hash: hash,
        fileSize: sampleBytes.byteLength,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate sample agreement.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-docusign-100 text-docusign-800 rounded-full text-xs font-semibold mb-3 border border-docusign-200">
          <Zap className="w-3.5 h-3.5 text-docusign-600 fill-docusign-600" />
          Powered by Cloudflare Workers & R2 Storage
        </div>
        <h1 className="text-4xl font-extrabold text-navy-900 tracking-tight sm:text-5xl">
          Sign documents online in seconds.
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Load any PDF, place your uploaded handwritten signature, and seal it with an authentic
          tamper-evident DocuSign audit trail.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-200 ${
          isDragging
            ? 'border-docusign-500 bg-docusign-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-white shadow-xl shadow-slate-200/50'
        }`}
      >
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-docusign-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-docusign-500/30 mb-6">
            <UploadCloud className="w-10 h-10 animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Upload a document to sign
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Drag and drop your PDF here, or click the button below to browse your files
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <label
              htmlFor="pdf-upload"
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-docusign-600 to-docusign-700 hover:from-docusign-700 hover:to-docusign-800 cursor-pointer shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
              Choose PDF File
            </label>

            <button
              type="button"
              onClick={handleLoadSampleAgreement}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Try Sample NDA
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-docusign-700 font-medium animate-pulse">
              <span className="w-2.5 h-2.5 bg-docusign-600 rounded-full animate-ping"></span>
              {loadingMessage}
            </div>
          )}
        </div>

        {/* Feature Badges below upload */}
        <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">DocuSign Certified Trail</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generates verifiable Certificate of Completion with SHA-256 hashes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Cloudflare Protected</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Global edge execution, encrypted storage with Cloudflare R2 & D1.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Handwritten Ink Isolation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload your signature on paper, we isolate pure ink transparently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
