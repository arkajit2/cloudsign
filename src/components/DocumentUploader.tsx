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
  signerName?: string;
  onSignerNameChange?: (name: string) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentLoaded,
  signerName = 'Jane Doe',
  onSignerNameChange,
}) => {
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
    <div className="max-w-4xl mx-auto py-12 px-4 text-[#FFFFC5]">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] rounded-full text-xs font-semibold mb-4 border border-[rgba(255,255,197,0.25)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFC5]" />
          Legally Binding & Tamper-Proof
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-[#FFFFC5] drop-shadow-sm">
          Sign documents online in seconds.
        </h1>
        <p className="mt-3 text-base text-[rgba(255,255,197,0.7)] max-w-2xl mx-auto leading-relaxed">
          Load any PDF, place your handwritten signature, and seal it with an authentic
          tamper-evident cryptographic audit trail.
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
            ? 'border-[#FFFFC5] bg-[rgba(255,255,197,0.08)] scale-[1.01]'
            : 'border-[rgba(255,255,197,0.25)] hover:border-[rgba(255,255,197,0.5)] bg-[rgba(255,255,197,0.03)] backdrop-blur-sm shadow-2xl'
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
          <div className="w-20 h-20 bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.3)] rounded-3xl flex items-center justify-center text-[#FFFFC5] shadow-lg mb-6">
            <UploadCloud className="w-10 h-10 animate-pulse text-[#FFFFC5]" />
          </div>

          <h2 className="text-2xl font-bold text-[#FFFFC5] mb-2">
            Upload a document to sign
          </h2>
          <p className="text-sm text-[rgba(255,255,197,0.65)] mb-5">
            Drag and drop your PDF here, or choose your file below
          </p>

          {/* Signer Name Input on Upload Screen */}
          <div className="w-full max-w-xs mb-6 text-left bg-[rgba(255,255,197,0.05)] p-3 rounded-2xl border border-[rgba(255,255,197,0.2)]">
            <label className="text-[10px] font-bold text-[rgba(255,255,197,0.65)] block mb-1 uppercase tracking-wider">
              Signer Full Name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => onSignerNameChange?.(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-1.5 text-xs bg-[rgba(52,21,57,0.7)] border border-[rgba(255,255,197,0.25)] focus:border-[#FFFFC5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FFFFC5] font-semibold text-[#FFFFC5] placeholder-[rgba(255,255,197,0.4)] transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <label
              htmlFor="pdf-upload"
              className={`w-full sm:w-auto px-7 py-3 rounded-full font-extrabold text-sm text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] cursor-pointer shadow-[0_4px_20px_rgba(255,255,197,0.25)] hover:shadow-[0_8px_30px_rgba(255,255,197,0.4)] hover:-translate-y-0.5 transition flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              Choose PDF File
            </label>

            <button
              type="button"
              onClick={handleLoadSampleAgreement}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-sm text-[#FFFFC5] bg-transparent hover:bg-[rgba(255,255,197,0.08)] border border-[rgba(255,255,197,0.35)] hover:border-[#FFFFC5] transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-[#FFFFC5]" />
              Try Sample NDA
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-[#FFFFC5] font-medium animate-pulse">
              <span className="w-2.5 h-2.5 bg-[#FFFFC5] rounded-full animate-ping"></span>
              {loadingMessage}
            </div>
          )}
        </div>

        {/* Feature Badges below upload */}
        <div className="mt-10 pt-8 border-t border-[rgba(255,255,197,0.15)] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="flex items-start gap-3 p-3 bg-[rgba(255,255,197,0.03)] border border-[rgba(255,255,197,0.12)] rounded-2xl">
            <div className="p-2 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#FFFFC5]">ESIGN & UETA Audit Trail</h3>
              <p className="text-[11px] text-[rgba(255,255,197,0.65)] mt-0.5">
                Generates verifiable Certificate of Completion with SHA-256 hashes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[rgba(255,255,197,0.03)] border border-[rgba(255,255,197,0.12)] rounded-2xl">
            <div className="p-2 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] rounded-xl shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#FFFFC5]">End-to-End Cryptographic Security</h3>
              <p className="text-[11px] text-[rgba(255,255,197,0.65)] mt-0.5">
                Immutable SHA-256 fingerprinting & tamper-evident digital seal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[rgba(255,255,197,0.03)] border border-[rgba(255,255,197,0.12)] rounded-2xl">
            <div className="p-2 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] rounded-xl shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#FFFFC5]">Handwritten Ink Isolation</h3>
              <p className="text-[11px] text-[rgba(255,255,197,0.65)] mt-0.5">
                Upload your signature on paper, we isolate pure ink transparently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
