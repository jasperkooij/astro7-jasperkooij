# Implementation Guide: Markdown Alternatives for AI Agents

## Overview

Add Markdown alternatives to all pages following Dries Buytaert's "third audience" concept. This enables AI agents to consume cleaner, machine-readable content versions of your Builder.io-powered pages.

**Article Reference:** https://dri.es/the-third-audience

## Architecture

**Implementation Method:**
- Use Astro middleware to intercept requests with `Accept: text/markdown` header
- Convert Builder.io blocks to Markdown on-demand using Turndown library
- Add `<link rel="alternate" type="text/markdown">` tags for auto-discovery
- Same URL serves both HTML and Markdown formats (proper content negotiation)

---

## Step 1: Install Dependencies

```bash
npm install turndown
npm install --save-dev @types/turndown
```

**What to modify:** `package.json`

**Expected result:** Dependencies added to package.json and node_modules installed.

---

## Step 2: Create Shared Builder.io Utility

**File to create:** `/src/utils/builderContent.ts`

```typescript
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

export async function fetchBuilderContent(
  apiKey: string,
  urlPath: string
): Promise<BuilderContent | null> {
  try {
    const url = `https://cdn.builder.io/api/v3/content/page?apiKey=${apiKey}&url=${urlPath}&cachebust=true`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0];
  } catch (error) {
    console.error('Error fetching Builder.io content:', error);
    return null;
  }
}
```

**Purpose:** Centralizes Builder.io API calls to avoid duplication between middleware and pages.

---

## Step 3: Create Markdown Converter

**File to create:** `/src/utils/builderToMarkdown.ts`

```typescript
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

function processBlock(block: any): string {
  if (!block) return '';

  const componentName = block.component?.name;

  // Handle Text blocks
  if (componentName === 'Text' || block['@type'] === '@builder.io/sdk:Element') {
    const text = block.component?.options?.text || '';
    if (text) {
      return turndownService.turndown(text) + '\n\n';
    }
  }

  // Handle Image blocks
  if (componentName === 'Image') {
    const image = block.component?.options?.image;
    const altText = block.component?.options?.altText || '';
    if (image) {
      return `![${altText}](${image})\n\n`;
    }
  }

  // Handle Section blocks (containers with children)
  if (componentName === 'Section' || block.children) {
    let content = '';
    if (block.children && Array.isArray(block.children)) {
      for (const child of block.children) {
        content += processBlock(child);
      }
    }
    return content;
  }

  // Handle contact forms or other components with descriptive text
  if (componentName === 'ContactForm') {
    return '## Contact\n\nFor inquiries, please use the contact form on the website.\n\n';
  }

  return '';
}

export function convertBuilderToMarkdown(content: any): string {
  if (!content || !content.data) {
    return '';
  }

  let markdown = '';

  // Add title if available
  if (content.data.title) {
    markdown += `# ${content.data.title}\n\n`;
  }

  // Add description if available
  if (content.data.description) {
    markdown += `${content.data.description}\n\n`;
  }

  // Process blocks
  if (content.data.blocks && Array.isArray(content.data.blocks)) {
    for (const block of content.data.blocks) {
      markdown += processBlock(block);
    }
  }

  return markdown.trim();
}
```

**Purpose:** Converts Builder.io block structure to clean Markdown using Turndown for HTML-to-Markdown conversion.

---

## Step 4: Create Middleware for Content Negotiation

**File to create:** `/src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';
import { fetchBuilderContent } from './utils/builderContent';
import { convertBuilderToMarkdown } from './utils/builderToMarkdown';

export const onRequest = defineMiddleware(async (context, next) => {
  const acceptHeader = context.request.headers.get('accept') || '';

  // Check if the client prefers Markdown
  const prefersMarkdown =
    acceptHeader.includes('text/markdown') ||
    (acceptHeader.includes('text/plain') && !acceptHeader.includes('text/html'));

  if (prefersMarkdown) {
    // Get the URL path
    const urlPath = context.url.pathname;

    // Fetch Builder.io content
    const apiKey = import.meta.env.PUBLIC_BUILDER_API_KEY;
    if (!apiKey) {
      return new Response('Builder.io API key not configured', { status: 500 });
    }

    const content = await fetchBuilderContent(apiKey, urlPath);

    if (!content) {
      return new Response('# Page Not Found\n\nThe requested page could not be found.', {
        status: 404,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }

    // Convert to Markdown
    const markdown = convertBuilderToMarkdown(content);

    // Return Markdown response
    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Continue with normal HTML rendering
  return next();
});
```

**Purpose:** Intercepts requests and serves Markdown when `Accept: text/markdown` header is present.

---

## Step 5: Create Auto-discovery Component

**File to create:** `/src/components/MarkdownAlternateLink.astro`

```astro
---
const currentUrl = new URL(Astro.url.pathname, Astro.site);
---
<link rel="alternate" type="text/markdown" href={currentUrl.href} />
```

**Purpose:** Adds auto-discovery link tag so AI agents can discover the Markdown version.

---

## Step 6: Update BaseLayout

**File to modify:** `/src/layouts/BaseLayout.astro`

**Location:** After line 34 (after the canonical link)

**Add this import at the top:**
```astro
import MarkdownAlternateLink from '../components/MarkdownAlternateLink.astro';
```

**Add this component after the canonical link (around line 34):**
```astro
<MarkdownAlternateLink />
```

**Example of what it should look like:**
```astro
<link rel="canonical" href={canonicalURL} />
<MarkdownAlternateLink />
```

---

## Step 7: Refactor index.astro to Use Shared Utility

**File to modify:** `/src/pages/index.astro`

**Add this import:**
```astro
import { fetchBuilderContent } from '../utils/builderContent';
```

**Replace the existing Builder.io fetch code** (look for the fetch call to cdn.builder.io) with:
```astro
const apiKey = import.meta.env.PUBLIC_BUILDER_API_KEY;
const content = await fetchBuilderContent(apiKey, '/');
```

**Keep the rest of the page logic the same** (error handling, rendering, etc.)

---

## Step 8: Refactor [...slug].astro to Use Shared Utility

**File to modify:** `/src/pages/[...slug].astro`

**Add this import:**
```astro
import { fetchBuilderContent } from '../utils/builderContent';
```

**Replace the existing Builder.io fetch code** with:
```astro
const apiKey = import.meta.env.PUBLIC_BUILDER_API_KEY;
const urlPath = `/${slug}`;
const content = await fetchBuilderContent(apiKey, urlPath);
```

**Keep the rest of the page logic the same** (error handling, rendering, etc.)

---

## Testing Instructions

### Local Testing

1. **Start the development server:**
```bash
npm run dev
```

2. **Test Markdown version of homepage:**
```bash
curl -H "Accept: text/markdown" http://localhost:4321/
```

Expected: Clean Markdown output of your homepage content.

3. **Test HTML version (should work normally):**
```bash
curl -H "Accept: text/html" http://localhost:4321/
```

Expected: Normal HTML response.

4. **Test auto-discovery tag:**
```bash
curl http://localhost:4321/ | grep 'rel="alternate"'
```

Expected: Should find the `<link rel="alternate" type="text/markdown"` tag.

5. **Test a dynamic page:**
```bash
curl -H "Accept: text/markdown" http://localhost:4321/about
```

Expected: Markdown version of the about page.

6. **Test in browser:**
- Open http://localhost:4321/ in your browser
- Right-click and "View Page Source"
- Search for `rel="alternate"`
- Verify the link tag is present

### Production Testing

1. **Build the project:**
```bash
npm run build
```

2. **Preview locally:**
```bash
npm run preview
```

3. **Test the preview:**
```bash
curl -H "Accept: text/markdown" http://localhost:4321/
```

4. **Deploy to Cloudflare Pages:**
```bash
npm run deploy
```

5. **Test production:**
```bash
curl -H "Accept: text/markdown" https://jasperkooij.com/
curl https://jasperkooij.com/ | grep 'rel="alternate"'
```

---

## Verification Checklist

- [ ] Dependencies installed (turndown, @types/turndown)
- [ ] `/src/utils/builderContent.ts` created
- [ ] `/src/utils/builderToMarkdown.ts` created
- [ ] `/src/middleware.ts` created
- [ ] `/src/components/MarkdownAlternateLink.astro` created
- [ ] `/src/layouts/BaseLayout.astro` updated with auto-discovery link
- [ ] `/src/pages/index.astro` refactored to use shared utility
- [ ] `/src/pages/[...slug].astro` refactored to use shared utility
- [ ] Markdown served when `Accept: text/markdown` header present
- [ ] HTML served normally when `Accept: text/html` header present
- [ ] Auto-discovery link appears in all page heads
- [ ] All Builder.io block types convert properly
- [ ] Works on localhost
- [ ] Works on production (Cloudflare Pages)

---

## Troubleshooting

### Issue: Middleware not intercepting requests
**Solution:** Ensure `/src/middleware.ts` exists and is named exactly that. Astro automatically detects this file.

### Issue: TypeScript errors about Turndown
**Solution:** Make sure `@types/turndown` is installed as a dev dependency.

### Issue: Empty Markdown output
**Solution:** Check that Builder.io API key is correctly set in environment variables. Verify content exists in Builder.io for that URL.

### Issue: HTML still rendering when requesting Markdown
**Solution:** Check that the Accept header is being sent correctly. Use `-H "Accept: text/markdown"` with curl.

### Issue: Auto-discovery link not appearing
**Solution:** Verify that `<MarkdownAlternateLink />` component is added to `BaseLayout.astro` and the component file exists.

---

## Key Files Summary

**New files:**
- `/src/middleware.ts` - Content negotiation logic
- `/src/utils/builderContent.ts` - Shared Builder.io fetching
- `/src/utils/builderToMarkdown.ts` - Markdown conversion
- `/src/components/MarkdownAlternateLink.astro` - Auto-discovery tag

**Modified files:**
- `/src/layouts/BaseLayout.astro` - Add auto-discovery component
- `/src/pages/index.astro` - Use shared fetching utility
- `/src/pages/[...slug].astro` - Use shared fetching utility
- `/package.json` - Add dependencies

---

## Success Criteria

✅ Markdown served when `Accept: text/markdown` header present
✅ HTML served normally when `Accept: text/html` header present
✅ Auto-discovery link appears in all page heads
✅ All Builder.io block types convert properly (Text, Image, Section)
✅ No performance degradation on HTML requests
✅ Works on both localhost and production (Cloudflare Pages)
✅ Contact form converts to descriptive text in Markdown
✅ Nested content structures maintain proper hierarchy

---

## Additional Notes

**Performance Considerations:**
- Middleware checks Accept header immediately and exits early if HTML is requested
- Builder.io CDN caches API responses
- Cloudflare edge caching handles Markdown response caching
- No significant overhead on HTML requests

**Content Conversion:**
- Text blocks containing HTML are converted using Turndown
- Images include alt text for accessibility
- Contact forms convert to descriptive text
- Nested sections maintain proper hierarchy through recursive processing

**Edge Cases Handled:**
- Missing Builder.io content returns 404 with Markdown error message
- Malformed Accept headers default to HTML
- Complex nested structures handled through recursion
- Empty blocks skipped to avoid excessive whitespace

---

## Implementation with Claude Agent in PhpStorm

When using this guide with Claude Agent in PhpStorm:

1. Share this entire document with Claude Agent
2. Ask Claude to implement each step sequentially
3. Review each file before proceeding to the next step
4. Test after completing all steps

**Example prompt for Claude Agent:**
"Implement the Markdown alternatives for AI agents following the implementation guide in IMPLEMENTATION_GUIDE.md. Start with Step 1 and proceed through each step in order."
