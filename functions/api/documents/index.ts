interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ documents: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM documents ORDER BY created_at DESC LIMIT 50'
    ).all();

    return new Response(JSON.stringify({ documents: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, documents: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    const title = (data.get('title') as string) || file?.name || 'Untitled Document';
    const sha256 = data.get('sha256') as string;
    const docId = data.get('id') as string || crypto.randomUUID();

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const originalKey = `originals/${docId}.pdf`;

    // Store in Cloudflare R2
    if (env.STORAGE) {
      await env.STORAGE.put(originalKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: { docId, title, sha256 },
      });
    }

    // Insert into Cloudflare D1
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO documents (id, title, status, file_size, sha256_hash, original_r2_key, created_at)
        VALUES (?, ?, 'draft', ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(docId, title, file.size, sha256, originalKey).run();

      // Log initial audit event
      const cfRay = request.headers.get('cf-ray') || 'local';
      const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Browser';

      await env.DB.prepare(`
        INSERT INTO audit_logs (id, document_id, action, ip_address, user_agent, cf_ray, sha256_checksum, timestamp)
        VALUES (?, ?, 'DOCUMENT_CREATED', ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), docId, ip, userAgent, cfRay, sha256).run();
    }

    return new Response(JSON.stringify({ success: true, id: docId, title, originalKey }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
