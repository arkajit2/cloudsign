import type { DocumentInfo, SignatureField } from '../types';

/**
 * Cloudflare Pages Functions API Client
 * Provides seamless sync with Cloudflare D1 & R2,
 * with resilient offline fallback for instantaneous testing.
 */

export const api = {
  // Check health and Cloudflare Edge presence
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch {
      // Local dev or static host
    }
    return {
      status: 'offline_or_local',
      platform: 'Client Direct (Cloudflare Ready)',
      edge: { colo: 'LOCAL' },
      services: { d1: false, r2: false },
    };
  },

  // Save document to Cloudflare D1 & R2
  async uploadDocument(
    docId: string,
    title: string,
    pdfBytes: Uint8Array,
    sha256: string
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('id', docId);
      formData.append('title', title);
      formData.append('sha256', sha256);
      formData.append(
        'file',
        new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        `${title}.pdf`
      );

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      return res.ok;
    } catch (err) {
      console.warn('Cloudflare API unavailable, using client storage:', err);
      return false;
    }
  },

  // Submit signed document to Cloudflare D1 & R2
  async submitSignedDocument(
    docId: string,
    envelopeId: string,
    signedPdfBytes: Uint8Array,
    signedHash: string,
    signerName: string,
    signerEmail: string,
    fields: SignatureField[]
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('envelopeId', envelopeId);
      formData.append('signedHash', signedHash);
      formData.append('signerName', signerName);
      formData.append('signerEmail', signerEmail);
      formData.append('fields', JSON.stringify(fields));
      formData.append(
        'signedPdf',
        new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        `${docId}_signed.pdf`
      );

      const res = await fetch(`/api/documents/${docId}/sign`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Cloudflare sign sync failed, proceeding with client certificate:', err);
    }
    return null;
  },

  // Fetch documents from Cloudflare D1
  async listDocuments(): Promise<DocumentInfo[]> {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        return (data.documents || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          fileSize: d.file_size,
          sha256Hash: d.sha256_hash,
          signedSha256Hash: d.signed_sha256_hash,
          createdAt: d.created_at,
          completedAt: d.completed_at,
          fields: [],
        }));
      }
    } catch {
      // Local dev fallback
    }
    return [];
  },
};
