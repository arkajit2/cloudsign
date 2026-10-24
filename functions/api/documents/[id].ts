interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const id = params.id as string;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 });
    }

    const doc = await env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first();
    if (!doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    const { results: signatures } = await env.DB.prepare(
      'SELECT * FROM signatures WHERE document_id = ?'
    ).bind(id).all();

    const { results: auditLogs } = await env.DB.prepare(
      'SELECT * FROM audit_logs WHERE document_id = ? ORDER BY timestamp ASC'
    ).bind(id).all();

    return new Response(
      JSON.stringify({
        document: doc,
        signatures: signatures || [],
        auditLogs: auditLogs || [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const id = params.id as string;

    if (env.STORAGE) {
      await env.STORAGE.delete(`originals/${id}.pdf`);
      await env.STORAGE.delete(`signed/${id}.pdf`);
    }

    if (env.DB) {
      await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
      await env.DB.prepare('DELETE FROM signatures WHERE document_id = ?').bind(id).run();
      await env.DB.prepare('DELETE FROM audit_logs WHERE document_id = ?').bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
