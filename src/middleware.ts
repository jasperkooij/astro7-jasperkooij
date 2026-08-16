import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { fetchBuilderContent } from './utils/builderContent';
import { convertBuilderToMarkdown } from './utils/builderToMarkdown';

export const onRequest = defineMiddleware(async (context, next) => {
  const acceptHeader = context.request.headers.get('accept') || '';

  const prefersMarkdown =
    acceptHeader.includes('text/markdown') ||
    (acceptHeader.includes('text/plain') && !acceptHeader.includes('text/html'));

  if (!prefersMarkdown) {
    const response = await next();
    response.headers.set('Vary', 'Accept');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (response.headers.get('content-type')?.includes('text/html')) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
      // Chrome WebMCP origin trial token (public by design). Set PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN after registering jasperkooij.com.
      const originTrialToken = import.meta.env.PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN;
      if (typeof originTrialToken === 'string' && originTrialToken.length > 0) {
        response.headers.set('Origin-Trial', originTrialToken);
      }
    }
    return response;
  }

  const urlPath = context.url.pathname;
  const apiKey = import.meta.env.PUBLIC_BUILDER_API_KEY;

  if (!apiKey) {
    return new Response('Builder.io API key not configured', { status: 500 });
  }

  const kv = (env as any).BUILDER_CACHE as KVNamespace | undefined;
  const content = await fetchBuilderContent(apiKey, urlPath, kv);

  if (!content) {
    return new Response('# Page Not Found\n\nThe requested page could not be found.', {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
      },
    });
  }

  const markdown = convertBuilderToMarkdown(content);

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000',
      'Vary': 'Accept',
    },
  });
});
