export type FieldType = 'signature' | 'initials' | 'date' | 'name' | 'text';

export type SignatureMode = 'upload' | 'draw' | 'type';

export interface SignatureField {
  id: string;
  type: FieldType;
  pageNumber: number; // 1-indexed
  x: number; // percentage (0 to 100) relative to page width
  y: number; // percentage (0 to 100) relative to page height
  width: number; // percentage relative to page width
  height: number; // percentage relative to page height
  signatureDataUrl?: string; // transparent PNG data URL of user's signature
  value?: string; // Text value for date, name, or text fields
  signerName: string;
  signerEmail?: string;
  signatureType?: SignatureMode;
}

export type DocumentStatus = 'draft' | 'pending' | 'completed' | 'revoked';

export interface DocumentInfo {
  id: string;
  title: string;
  status: DocumentStatus;
  pageCount: number;
  fileSize: number;
  sha256Hash: string;
  signedSha256Hash?: string;
  createdAt: string;
  completedAt?: string;
  fields: SignatureField[];
  originalPdfBytes?: Uint8Array;
  signedPdfBytes?: Uint8Array;
  downloadUrl?: string;
}

export interface AuditLogItem {
  id: string;
  documentId: string;
  action: 'DOCUMENT_CREATED' | 'DOCUMENT_VIEWED' | 'SIGNATURE_ADDED' | 'DOCUMENT_SIGNED' | 'DOCUMENT_DOWNLOADED' | 'DOCUMENT_VERIFIED';
  actorName: string;
  actorEmail?: string;
  ipAddress: string;
  userAgent: string;
  cfRay?: string;
  cfColo?: string;
  sha256Checksum?: string;
  timestamp: string;
  details?: string;
}

export interface SignatureStyle {
  id: string;
  name: string;
  fontFamily: string;
}
