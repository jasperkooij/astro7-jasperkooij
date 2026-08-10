# Migration Plan: Builder.io → Storyblok

## Approach: New Repo

Clone `jk-astro-builder-cf` → `jk-astro-storyblok-cf`. Keep the current site live at jasperkooij.com until the new repo is fully tested, then cut DNS over.

A new Cloudflare Pages project (`jk-astro-storyblok-cf.pages.dev`) acts as staging throughout.

---

## What Changes vs What Stays

### Stays (no changes needed)
- Astro framework, project structure, routing
- Svelte + Tailwind + DaisyUI
- BaseLayout, Navbar, Footer, ContactForm, FAQSchema components
- Cloudflare Pages deployment via GitHub
- KV caching pattern (reuse, rename binding)
- Markdown content negotiation middleware (logic stays, data source changes)
- `llms.txt`, sitemap, robots.txt, all SEO work

### Changes (Builder.io → Storyblok)

| Current | Replacement |
|---|---|
| `@builder.io/sdk` + `@builder.io/sdk-svelte` | `@storyblok/astro` |
| `src/utils/builderContent.ts` | `src/utils/storyblokContent.ts` |
| `src/utils/builderToMarkdown.ts` | Updated for Storyblok content structure |
| `src/components/BuilderContentHybrid.svelte` | `src/components/StoryblokRenderer.svelte` |
| `src/components/BuilderContent.svelte` | Delete |
| `src/components/BuilderContentStatic.astro` | `src/components/StoryblokRendererStatic.astro` |
| `src/middleware.ts` | Update data source only |
| `src/pages/api/revalidate.ts` | Update for Storyblok webhook payload |
| `PUBLIC_BUILDER_API_KEY` | `PUBLIC_STORYBLOK_TOKEN` |
| `BUILDER_CACHE` KV binding | `STORYBLOK_CACHE` |

---

## Key Architectural Differences

### Content Model
- Builder.io: `page` model → `data.blocks[]` array of typed blocks
- Storyblok: "Stories" → `content` object with nested `body[]` of "Bloks"

### API
- Builder.io: `cdn.builder.io/api/v3/content/page?apiKey=...&url=/`
- Storyblok: `api.storyblok.com/v2/cdn/stories/{slug}?token=...&version=published`

### Preview Mode
- Builder.io: `?builder.preview=true` or `isPreviewing()` from SDK
- Storyblok: Visual Editor iframe, detects via `_storyblok` query param or draft token

### Webhook Payload
- Builder.io: `body.newValue.data.url` → page URL to invalidate
- Storyblok: `body.story.full_slug` → story slug to invalidate

### SDK / Live Editing
- Builder.io: `<Content>` from `@builder.io/sdk-svelte`
- Storyblok: `<StoryblokComponent>` + `useStoryblokApi()` from `@storyblok/astro`

---

## Implementation Steps

1. **Create new GitHub repo** — `jk-astro-storyblok-cf`
2. **New Cloudflare Pages project** — connect to new repo, use as staging
3. **Create Storyblok Space** — define content types matching current pages
4. **Migrate content** — recreate Builder.io pages as Storyblok Stories (straightforward, content is simple)
5. **Swap SDK** — remove `@builder.io/*`, install `@storyblok/astro`
6. **Rewrite fetch utility** — `storyblokContent.ts` with same KV caching pattern
7. **Rewrite components** — `StoryblokRenderer.svelte` + `StoryblokRendererStatic.astro`
8. **Update middleware** — point Markdown negotiation at Storyblok API
9. **Update webhook endpoint** — `/api/revalidate.ts` for Storyblok payload
10. **Update env vars** — in Cloudflare Pages dashboard and `.env`
11. **Test on staging** — HTML, Markdown negotiation, preview mode, cache invalidation
12. **DNS cutover** — point jasperkooij.com to new Cloudflare Pages project

---

## Verification Checklist
- [ ] `bun run build` passes cleanly
- [ ] Page renders with Storyblok content locally
- [ ] Storyblok Visual Editor preview works (`?_storyblok=...`)
- [ ] `curl -H "Accept: text/markdown" https://staging-url/` returns Markdown
- [ ] Publish in Storyblok → webhook fires → KV cleared → fresh content served
- [ ] `https://staging-url/sitemap-index.xml` returns valid XML
- [ ] Playwright audit: all SEO tags present, no regressions
