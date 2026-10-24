import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentUploader } from './components/DocumentUploader';
import { PDFSigningCanvas } from './components/PDFSigningCanvas';
import { SignatureModal } from './components/SignatureModal';
import { CompletionModal } from './components/CompletionModal';
import { AuditTrailViewer } from './components/AuditTrailViewer';
import { DocumentHistoryModal } from './components/DocumentHistoryModal';
import type { DocumentInfo, SignatureField, AuditLogItem } from './types';
import { generateEnvelopeId } from './utils/crypto';
import { stampDocument } from './utils/pdfStamper';
import { api } from './services/api';

export function App() {
  // Document state
  const [currentDoc, setCurrentDoc] = useState<DocumentInfo | null>(null);
  const [fields, setFields] = useState<SignatureField[]>([]);
  const [documentsHistory, setDocumentsHistory] = useState<DocumentInfo[]>([]);

  // Signer configuration
  const [signerName, setSignerName] = useState<string>('Jane Doe');
  const [signerEmail, setSignerEmail] = useState<string>('jane.doe@example.com');

  // Modals state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>(undefined);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isAuditViewerOpen, setIsAuditViewerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Signing progress & result
  const [isSigning, setIsSigning] = useState(false);
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [signedPdfBytes, setSignedPdfBytes] = useState<Uint8Array | null>(null);
  const [signedHash, setSignedHash] = useState<string>('');
  const [completedTimestamp, setCompletedTimestamp] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloudsign_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        setDocumentsHistory(parsed);
      }
    } catch (e) {
      console.error('Failed to load document history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (doc: DocumentInfo) => {
    setDocumentsHistory((prev) => {
      const updated = [doc, ...prev.filter((d) => d.id !== doc.id)];
      try {
        // Strip out large byte arrays for local storage
        const metadataOnly = updated.map((d) => ({
          ...d,
          originalPdfBytes: undefined,
          signedPdfBytes: undefined,
        }));
        localStorage.setItem('cloudsign_documents', JSON.stringify(metadataOnly));
      } catch (e) {
        console.error('Storage error:', e);
      }
      return updated;
    });
  };

  // 1. When a PDF is loaded (uploaded or sample)
  const handleDocumentLoaded = async (data: {
    title: string;
    pdfBytes: Uint8Array;
    sha256Hash: string;
    fileSize: number;
  }) => {
    const newEnvelopeId = generateEnvelopeId();
    setEnvelopeId(newEnvelopeId);

    const safeBytes = new Uint8Array(data.pdfBytes.slice());

    const newDoc: DocumentInfo = {
      id: newEnvelopeId,
      title: data.title,
      status: 'pending',
      pageCount: 1, // updated dynamically in viewer
      fileSize: data.fileSize,
      sha256Hash: data.sha256Hash,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      fields: [],
      originalPdfBytes: safeBytes,
    };

    setCurrentDoc(newDoc);
    setFields([]);
    setSignedPdfBytes(null);
    setSignedHash('');

    // Initial audit logs
    const initialLog: AuditLogItem = {
      id: `log_${Date.now()}_1`,
      documentId: newEnvelopeId,
      action: 'DOCUMENT_CREATED',
      actorName: signerName,
      actorEmail: signerEmail,
      ipAddress: 'Authenticated Web Session (TLS)',
      userAgent: navigator.userAgent,
      sha256Checksum: data.sha256Hash,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `Envelope initialized with title: "${data.title}"`,
    };
    setAuditLogs([initialLog]);

    // Async upload to Cloudflare D1/R2 in background
    api.uploadDocument(newEnvelopeId, data.title, data.pdfBytes, data.sha256Hash);
  };

  // 2. Open signature modal
  const handleOpenSignatureModal = (fieldId?: string) => {
    setTargetFieldId(fieldId);
    setIsSignatureModalOpen(true);
  };

  // 3. Save signature from modal
  const handleSaveSignature = (
    signatureDataUrl: string,
    name: string,
    mode: 'upload' | 'draw' | 'type'
  ) => {
    setSignerName(name);

    if (targetFieldId) {
      // Update targeted field
      setFields((prev) =>
        prev.map((f) =>
          f.id === targetFieldId
            ? {
                ...f,
                signatureDataUrl,
                signerName: name,
                signatureType: mode,
              }
            : f
        )
      );
    } else {
      // Create new signature field
      const newField: SignatureField = {
        id: `field_${Date.now()}`,
        type: 'signature',
        pageNumber: 1,
        x: 35,
        y: 65,
        width: 28,
        height: 9,
        signatureDataUrl,
        signerName: name,
        signatureType: mode,
      };
      setFields((prev) => [...prev, newField]);
    }

    // Add audit log for signature adoption
    if (currentDoc) {
      const adoptionLog: AuditLogItem = {
        id: `log_${Date.now()}`,
        documentId: currentDoc.id,
        action: 'SIGNATURE_ADDED',
        actorName: name,
        actorEmail: signerEmail,
        ipAddress: 'Authenticated Web Session (TLS)',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        details: `Signer adopted electronic signature via method: ${mode.toUpperCase()}`,
      };
      setAuditLogs((prev) => [...prev, adoptionLog]);
    }
  };

  // 4. Burn signatures and finish document
  const handleCompleteSigning = async () => {
    if (!currentDoc || !currentDoc.originalPdfBytes || currentDoc.originalPdfBytes.byteLength === 0) {
      alert('Document data is not loaded. Please upload or choose a document.');
      return;
    }

    try {
      setIsSigning(true);

      const stampResult = await stampDocument({
        originalPdfBytes: new Uint8Array(currentDoc.originalPdfBytes.slice()),
        fields,
        envelopeId,
        documentTitle: currentDoc.title,
        signerName,
        signerEmail,
        ipAddress: 'Verified Network Session',
        appendCertificate: true,
      });

      setSignedPdfBytes(stampResult.signedPdfBytes);
      setSignedHash(stampResult.signedHash);
      setCompletedTimestamp(stampResult.completedAt);

      // Final completion audit log
      const completionLog: AuditLogItem = {
        id: `log_${Date.now()}`,
        documentId: envelopeId,
        action: 'DOCUMENT_SIGNED',
        actorName: signerName,
        actorEmail: signerEmail,
        ipAddress: 'Verified Network Session',
        userAgent: navigator.userAgent,
        sha256Checksum: stampResult.signedHash,
        timestamp: stampResult.completedAt.replace('T', ' ').slice(0, 19),
        details: `Cryptographic ESIGN/UETA Certificate sealed. Signed SHA-256: ${stampResult.signedHash.slice(0, 16)}...`,
      };
      const updatedAudit = [...auditLogs, completionLog];
      setAuditLogs(updatedAudit);

      // Update doc record
      const updatedDoc: DocumentInfo = {
        ...currentDoc,
        status: 'completed',
        signedSha256Hash: stampResult.signedHash,
        completedAt: stampResult.completedAt,
        signedPdfBytes: stampResult.signedPdfBytes,
      };
      setCurrentDoc(updatedDoc);
      saveToHistory(updatedDoc);

      // Async sync to Cloudflare D1 & R2
      api.submitSignedDocument(
        currentDoc.id,
        envelopeId,
        stampResult.signedPdfBytes,
        stampResult.signedHash,
        signerName,
        signerEmail,
        fields
      );

      setIsSigning(false);
      setIsCompletionModalOpen(true);
    } catch (err: any) {
      console.error('Failed to sign document:', err);
      const msg = err?.message || String(err) || 'Unknown error';
      alert(`Error stamping signatures onto document: ${msg}`);
      setIsSigning(false);
    }
  };

  const handleSignAnother = () => {
    setCurrentDoc(null);
    setFields([]);
    setSignedPdfBytes(null);
    setSignedHash('');
    setIsCompletionModalOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
    setDocumentsHistory((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem('cloudsign_documents', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#341539] text-[#FFFFC5] flex flex-col font-sans">
      <Header
        onNewDocument={() => setCurrentDoc(null)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={documentsHistory.length}
      />

      <main className="flex-1 flex flex-col">
        {!currentDoc || !currentDoc.originalPdfBytes ? (
          <DocumentUploader
            onDocumentLoaded={handleDocumentLoaded}
            signerName={signerName}
            onSignerNameChange={setSignerName}
          />
        ) : (
          <PDFSigningCanvas
            pdfBytes={currentDoc.originalPdfBytes}
            documentTitle={currentDoc.title}
            fields={fields}
            onFieldsChange={setFields}
            onOpenSignatureModal={handleOpenSignatureModal}
            onCompleteSigning={handleCompleteSigning}
            isProcessing={isSigning}
            defaultSignerName={signerName}
            signerEmail={signerEmail}
            onSignerNameChange={(newName) => {
              setSignerName(newName);
              setFields((prev) =>
                prev.map((f) =>
                  f.type === 'name' ? { ...f, value: newName, signerName: newName } : f
                )
              );
            }}
            onSignerEmailChange={setSignerEmail}
          />
        )}
      </main>

      {/* Signature Adoption Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
        defaultName={signerName}
      />

      {/* Completion & Confetti Celebration Modal */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        documentTitle={currentDoc?.title || 'Document'}
        envelopeId={envelopeId}
        originalHash={currentDoc?.sha256Hash || ''}
        signedHash={signedHash}
        signedPdfBytes={signedPdfBytes}
        onViewAuditTrail={() => {
          setIsCompletionModalOpen(false);
          setIsAuditViewerOpen(true);
        }}
        onSignAnother={handleSignAnother}
      />

      {/* Audit Trail & Certificate of Completion Viewer */}
      <AuditTrailViewer
        isOpen={isAuditViewerOpen}
        onClose={() => setIsAuditViewerOpen(false)}
        documentTitle={currentDoc?.title || 'Document'}
        envelopeId={envelopeId}
        originalHash={currentDoc?.sha256Hash || ''}
        signedHash={signedHash}
        completedAt={completedTimestamp}
        signerName={signerName}
        signerEmail={signerEmail}
        auditLogs={auditLogs}
      />

      {/* Document History Modal */}
      <DocumentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        documents={documentsHistory}
        onSelectDocument={(doc) => {
          if (doc.originalPdfBytes) {
            setCurrentDoc(doc);
            setFields(doc.fields || []);
          } else {
            alert('Opening metadata. Upload PDF again to sign new instances.');
          }
        }}
        onDeleteDocument={handleDeleteHistory}
      />
    </div>
  );
}

export default App;
