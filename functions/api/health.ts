interface Env {
  DB?: D1Database;
  STORAGE?: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cf = (request as any).cf || {};

  return new Response(
    JSON.stringify({
      status: 'healthy',
      platform: 'Cloudflare Pages Functions',
      timestamp: new Date().toISOString(),
      edge: {
        colo: cf.colo || 'LOCAL_DEV',
        country: cf.country || 'UNKNOWN',
        city: cf.city || 'UNKNOWN',
        asn: cf.asn || 0,
      },
      services: {
        d1: !!env.DB,
        r2: !!env.STORAGE,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
