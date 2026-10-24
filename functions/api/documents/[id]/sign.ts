interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  try {
    const docId = params.id as string;
    const formData = await request.formData();
    const signedPdf = formData.get('signedPdf') as File;
    const signedHash = formData.get('signedHash') as string;
    const envelopeId = (formData.get('envelopeId') as string) || docId;
    const signerName = (formData.get('signerName') as string) || 'Signer';
    const signerEmail = (formData.get('signerEmail') as string) || 'signer@example.com';
    const fieldsJson = formData.get('fields') as string;

    const cfRay = request.headers.get('cf-ray') || 'local-edge';
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Browser';
    const cf = (request as any).cf || {};
    const cfColo = cf.colo || 'EDGE';

    const signedKey = `signed/${docId}.pdf`;

    // 1. Upload Signed PDF into Cloudflare R2
    if (env.STORAGE && signedPdf) {
      await env.STORAGE.put(signedKey, await signedPdf.arrayBuffer(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: {
          docId,
          envelopeId,
          signedHash,
          signerName,
          cfRay,
        },
      });
    }

    // 2. Update Document Status & Store in Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        UPDATE documents
        SET status = 'completed',
            signed_sha256_hash = ?,
            signed_r2_key = ?,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(signedHash, signedKey, docId).run();

      // Record signature placements
      if (fieldsJson) {
        try {
          const fields = JSON.parse(fieldsJson);
          for (const f of fields) {
            await env.DB.prepare(`
              INSERT INTO signatures (id, document_id, page_number, x_percent, y_percent, width_percent, height_percent, signer_name, signer_email, signature_type, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
              f.id || crypto.randomUUID(),
              docId,
              f.pageNumber,
              f.x,
              f.y,
              f.width,
              f.height,
              f.signerName || signerName,
              f.signerEmail || signerEmail,
              f.signatureType || 'uploaded'
            ).run();
          }
        } catch (e) {
          console.error('Error recording signature placements:', e);
        }
      }

      // Record Final Audit Log in Cloudflare D1
      await env.DB.prepare(`
        INSERT INTO audit_logs (id, document_id, action, actor_name, actor_email, ip_address, user_agent, cf_ray, cf_colo, sha256_checksum, metadata, timestamp)
        VALUES (?, ?, 'DOCUMENT_SIGNED', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        crypto.randomUUID(),
        docId,
        signerName,
        signerEmail,
        ip,
        userAgent,
        cfRay,
        cfColo,
        signedHash,
        JSON.stringify({ envelopeId, edgeVerified: true })
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId: docId,
        envelopeId,
        signedHash,
        signedKey,
        edge: { cfRay, cfColo, ip },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
