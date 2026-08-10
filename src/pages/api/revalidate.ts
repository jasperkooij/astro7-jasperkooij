import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Verify webhook secret
  const secret = request.headers.get('x-webhook-secret');
  const expectedSecret = import.meta.env.WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const kv = (env as any).BUILDER_CACHE as KVNamespace | undefined;

  if (!kv) {
    return new Response('KV not available', { status: 500 });
  }

  try {
    const body = (await request.json()) as any;

    // Builder.io sends the content model and data in the webhook payload.
    // Extract the URL path if provided, otherwise purge all known pages.
    const urlPath = body?.newValue?.data?.url as string | undefined;

    if (urlPath) {
      await kv.delete(`builderContent:${urlPath}`);
    } else {
      // Purge common paths when no specific URL is provided
      const paths = ['/', ...((body?.newValue?.data?.url ? [body.newValue.data.url] : []))];
      await Promise.all(paths.map((p: string) => kv.delete(`builderContent:${p}`)));
    }

    return new Response(JSON.stringify({ revalidated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Revalidate error:', error);
    return new Response('Invalid request body', { status: 400 });
  }
};
