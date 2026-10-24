-- CloudSign D1 Database Migration: Initial Schema
-- Supports Documents, Signature Placements, and Compliant Audit Logs

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_signature, completed, revoked
    file_size INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 1,
    sha256_hash TEXT,
    signed_sha256_hash TEXT,
    original_r2_key TEXT,
    signed_r2_key TEXT,
    original_data_url TEXT,
    signed_data_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

CREATE TABLE IF NOT EXISTS signatures (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    x_percent REAL NOT NULL,
    y_percent REAL NOT NULL,
    width_percent REAL NOT NULL,
    height_percent REAL NOT NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT,
    signature_type TEXT NOT NULL, -- uploaded, drawn, typed
    r2_image_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signatures_doc ON signatures(document_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- CREATED, VIEWED, SIGNATURE_PLACED, SIGNED, DOWNLOADED, VERIFIED
    actor_name TEXT,
    actor_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    cf_ray TEXT,
    cf_colo TEXT,
    sha256_checksum TEXT,
    metadata TEXT, -- JSON string with extra details
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_doc ON audit_logs(document_id, timestamp ASC);
