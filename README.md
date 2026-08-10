# jasperkooij.com

Source for [jasperkooij.com](https://jasperkooij.com) — an Astro 7 + Svelte site with content pulled live from [Builder.io](https://www.builder.io/) (headless CMS), cached in Cloudflare KV, and deployed on Cloudflare Workers.

## Stack

- [Astro 7](https://astro.build) with the [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) adapter
- [Svelte 5](https://svelte.dev) for interactive components
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config, `src/styles/global.css`) + [daisyUI](https://daisyui.com)
- [Builder.io](https://www.builder.io/) as the CMS — pages are fetched at request time in `src/pages/[...slug].astro` and cached in the `BUILDER_CACHE` Cloudflare KV namespace (see `src/utils/builderContent.ts`)
- `POST /api/revalidate` — webhook that purges the KV cache when content is republished in Builder.io

## Project structure

```text
/
├── public/              static assets, robots.txt, _headers, _redirects
└── src/
    ├── components/      Astro + Svelte components, incl. Builder.io block renderers
    ├── layouts/         BaseLayout.astro
    ├── pages/           index.astro, [...slug].astro, api/revalidate.ts
    ├── styles/          global.css (Tailwind v4 + daisyUI)
    ├── utils/           Builder.io fetch/cache + HTML-to-Markdown helpers
    └── middleware.ts
```

## Commands

This project uses [pnpm](https://pnpm.io).

| Command             | Action                                        |
| :------------------- | :--------------------------------------------- |
| `pnpm install`        | Install dependencies                           |
| `pnpm dev`             | Start local dev server at `localhost:4321`     |
| `pnpm build`           | Build the production site to `./dist/`         |
| `pnpm preview`         | Preview the build locally                      |
| `pnpm check`           | Type-check with `astro check`                  |
| `pnpm format`          | Format with Prettier                           |
| `pnpm generate-types`  | Regenerate Cloudflare Worker types via Wrangler |

## Environment variables

Local dev needs a `.env` (gitignored) with:

```
PUBLIC_BUILDER_API_KEY=...
PUBLIC_GOOGLE_ANALYTICS_ID=...
```

`WEBHOOK_SECRET` (used by `/api/revalidate`) is set as a Cloudflare Worker secret, not in local `.env`.

## Deploying

The Cloudflare Worker is connected to this repo via Cloudflare's dashboard Git integration (Workers Builds) — pushing to `main` triggers a build (`pnpm install && pnpm build`) and deploy automatically, using `wrangler.jsonc` for the Worker config (KV binding, assets, compatibility flags). No GitHub Actions workflow is used for deployment.
