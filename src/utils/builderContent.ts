export interface BuilderBlock {
  '@type': string;
  component?: {
    name: string;
    options?: {
      text?: string;
      image?: string;
      altText?: string;
      [key: string]: any;
    };
  };
  children?: BuilderBlock[];
  [key: string]: any;
}

export interface BuilderContent {
  data?: {
    blocks?: BuilderBlock[];
    title?: string;
    description?: string;
  };
}

const KV_TTL = 86400; // 24 hours fallback TTL

export async function fetchBuilderContent(
  apiKey: string,
  urlPath: string,
  kv?: KVNamespace
): Promise<BuilderContent | null> {
  const cacheKey = `builderContent:${urlPath}`;

  // Check KV cache first
  if (kv) {
    try {
      const cached = await kv.get(cacheKey, 'json');
      if (cached) {
        return cached as BuilderContent;
      }
    } catch {
      // KV read failed, fall through to live fetch
    }
  }

  // Fetch from Builder.io
  try {
    const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}&url=${urlPath}&cachebust=true`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as any;

    if (!data?.results?.length) {
      return null;
    }

    const content = data.results[0] as BuilderContent;

    // Store in KV for future requests
    if (kv) {
      try {
        await kv.put(cacheKey, JSON.stringify(content), { expirationTtl: KV_TTL });
      } catch {
        // KV write failed, continue without caching
      }
    }

    return content;
  } catch (error) {
    console.error('Error fetching Builder.io content:', error);
    return null;
  }
}