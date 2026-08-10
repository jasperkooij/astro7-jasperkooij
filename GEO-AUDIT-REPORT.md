# GEO Audit Report: Jasper Kooij — Full Stack Developer

**Audit Date:** 2026-08-09
**URL:** https://astro7-jasperkooij.jasperkooij.workers.dev/ (pre-launch; canonical target: https://jasperkooij.com/)
**Business Type:** Agency/Services (solo developer/consultant personal portfolio)
**Pages Analyzed:** 1 (single-page site — sitemap confirms only the homepage is indexed)

---

## Fixes Applied (2026-08-09, post-audit)

The following code-level fixes were implemented and verified after this audit. Items requiring CMS content edits (bio prose, case studies) or external accounts (Wikidata, YouTube, Bing Webmaster) are listed separately below and were **not** touched — they need your input.

- **Correction:** the "broken `/llms-full.txt`" High finding below was a false positive from the audit subagent — the actual `<link rel="alternate" type="text/markdown">` correctly points back at the page's own URL (markdown is served via `Accept: text/markdown` content negotiation on the same URL, not a separate file). No fix was needed; verified the real link is correct.
- **Fixed:** FAQ content is now rendered visibly on-page (a daisyUI accordion) in addition to the JSON-LD `FAQPage` schema — previously it only existed inside a `<script>` tag, invisible to text extraction (including the site's own markdown-negotiation feature).
- **Fixed:** `WebPage` schema changed to `ProfilePage` with `mainEntity` pointing at the `Person` node — more semantically precise for a personal portfolio.
- **Fixed:** `copyrightHolder`/`copyrightYear`/`publishingPrinciples` moved off `Person` (invalid domain per schema.org) onto `ProfilePage`; `copyrightYear` is now computed dynamically (`new Date().getFullYear()`) instead of hardcoded to 2025.
- **Fixed:** `dateModified` is now wired from Builder.io's own `lastUpdated` content-API field (added to the `BuilderContent` TypeScript interface) and passed through to the `ProfilePage` schema when available — a real freshness signal instead of a fabricated timestamp.
- **Fixed:** added `hasOfferCatalog`/`Service` schema to `Person`, listing the six services already named in the FAQ answers (full-stack dev, technical leadership, booking-engine integration, performance/CWV, SEO/A-B testing, cloud analytics).
- **Fixed:** `worksFor.url` added (`https://blend.travel`) — verified via web search that Blend Marketing's About page names Jasper directly, so this is a confirmed, not guessed, entity link.
- **Fixed:** added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Strict-Transport-Security` headers, plus `Cache-Control: public, max-age=300, s-maxage=3600` on HTML responses, via `src/middleware.ts` (verified this is the correct place — `public/_headers` rules don't reach SSR-rendered responses, only literal static assets).
- **Fixed (bonus, found during verification):** `[...slug].astro` always returned HTTP 200 even for nonexistent pages (soft-404) — now returns a proper 404 status when Builder.io has no matching content for the path.
- **Deferred, not attempted:** a Content-Security-Policy header was considered but skipped — the page mixes Formspree, Builder.io CDN images, Google Analytics, and inline/hydration scripts, and a wrong CSP could silently break the contact form or hydration. Worth a dedicated pass with real testing, not a drive-by addition.

**Not fixable in code** (need your input — these are CMS content or external-account actions):
- Bio prose rewrite / bolded standalone identity sentence — lives in Builder.io, not this repo.
- Case studies, portfolio, testimonials — new content you'd need to write/curate.
- Wikidata entity registration, YouTube presence, Bing Webmaster verification — external accounts only you can create.

---

## Executive Summary

**Overall GEO Score: 55/100 (Poor)**

The site's technical foundation is genuinely strong — full SSR (no JS-dependent content), clean crawlable structure, permissive AI-crawler access, working `Accept: text/markdown` content negotiation, and solid JSON-LD coverage. But the score is dragged down by the two heaviest-weighted categories: **Brand Authority** (real professional profiles exist, but no press, no Wikipedia/Wikidata entity, no testimonials, no third-party citations) and **Content E-E-A-T** (no case studies, no portfolio of past work, no dated content, no proof behind the "25 years" and "Blend Marketing" claims). This is a technically well-built site with thin external validation and shallow content depth — exactly the profile of a site AI systems can *crawl* easily but have little independent reason to *cite or recommend*.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 66/100 | 25% | 16.5 |
| Brand Authority | 32/100 | 20% | 6.4 |
| Content E-E-A-T | 40/100 | 20% | 8.0 |
| Technical GEO | 85/100 | 15% | 12.75 |
| Schema & Structured Data | 64/100 | 10% | 6.4 |
| Platform Optimization | 49/100 | 10% | 4.9 |
| **Overall GEO Score** | | | **55/100** |

---

## Critical Issues (Fix Immediately)

None found. No AI crawlers are blocked, the site is fully server-rendered, and there's no domain-level indexability blocker. This is a genuine strength worth preserving through the upcoming custom-domain cutover.

## High Priority Issues

1. ~~**FAQPage schema content is invisible to plain-text extraction.**~~ **[FIXED]** The 4 Q&A pairs now render as a visible on-page accordion in addition to the JSON-LD schema.
2. ~~**`/llms-full.txt` is a soft-404.**~~ **[CORRECTED — false positive]** Verified the actual `<link rel="alternate">` href points at the page's own URL, not a separate `/llms-full.txt` file. Markdown is served correctly via content negotiation on that same URL. No bug existed here.
3. **No topical depth for Google AI Overviews / Gemini.** Single homepage, no question-phrased subheadings, no 40-60 word direct-answer blocks outside the FAQ. *(Now partially mitigated — FAQ is visible — but still only one page.)*
4. **Zero Google-ecosystem entity footprint (Gemini).** No YouTube activity, no Google Business Profile, no Wikidata item — currently the single biggest platform gap. *(Needs an external account — not fixable in code.)*
5. **No portfolio/case studies of past client work.** For a consultant selling integration/leadership expertise, this is the biggest lever available — it caps both Experience and Authoritativeness scores. *(Needs new content — not fixable in code.)*
6. **No third-party validation anywhere** — no testimonials, no client logos, no press mentions, no reviews. Confirmed via web search: strong personal-profile presence (LinkedIn, GitHub with 19 repos, X, Bluesky) but nothing independent vouching for the work. *(Needs new content — not fixable in code.)*

## Medium Priority Issues

1. ~~`WebPage` schema should be `ProfilePage`~~ **[FIXED]** — now `ProfilePage` with `mainEntity` → Person.
2. ~~`copyrightHolder`/`copyrightYear`/`publishingPrinciples` misapplied to `Person`~~ **[FIXED]** — moved to `ProfilePage`, `copyrightYear` now computed dynamically.
3. ~~`worksFor` is a bare stub~~ **[FIXED]** — added verified `url: https://blend.travel` (confirmed via their About page).
4. ~~No `Service`/`OfferCatalog` schema~~ **[FIXED]** — added `hasOfferCatalog` with the 6 services already named in the FAQ.
5. ~~No `dateModified`/`datePublished` anywhere~~ **[FIXED]** — wired from Builder.io's `lastUpdated` field when available; `copyrightYear` no longer hardcoded/stale.
6. ~~No security headers configured~~ **[FIXED]** — `HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` added via middleware. (CSP deliberately deferred — see Fixes Applied section.)
7. ~~No `Cache-Control` on the main HTML document~~ **[FIXED]** — `public, max-age=300, s-maxage=3600` added via middleware.
8. **Bio content is prose-heavy with low statistical density** — no bolded key terms, no quantified claims beyond "25 years." *(CMS content — not fixable in code.)*
9. **GitHub profile (19 repos) is mostly forks/starter templates** — weakens the Expertise signal. *(Your GitHub activity — not fixable in code.)*

## Low Priority Issues

1. Twitter Card missing explicit `twitter:title`/`description`/`image` (falls back to complete OG tags, so low functional impact).
2. No resource hints (`preconnect`/`preload`) for above-fold assets.
3. No `msvalidate.01` Bing verification tag; confirm IndexNow key presence once jasperkooij.com is live.
4. No `BreadcrumbList`/`speakable` schema — low impact given the single-page structure.
5. Canonical URLs, sitemap, and robots.txt already point to `jasperkooij.com` while served from `*.workers.dev` — correct intentional pre-cutover state, not a bug, but add a launch-checklist item to verify the workers.dev origin gets redirected/deindexed once the custom domain goes live (avoid duplicate-host content).

---

## Category Deep Dives

### AI Citability (66/100)
Crawler access is fully open (100/100 sub-score) and `llms.txt` is well-formed (70/100, capped by the broken `llms-full.txt` link). The booking-engine list (Ventrata, Roller, Peek Pro, FareHarbor, Galaxy Connect, Rezdy) is the single strongest citable block on the page — specific, named, list-formatted, and genuinely differentiated content most developer portfolios lack. The `Accept: text/markdown` content negotiation is a real technical differentiator, confirmed working end-to-end. The ceiling here is the gap between what's *structured* (FAQ schema) and what's actually *extractable as text* by the very mechanism the site itself offers.

### Brand Authority (32/100)
Verified via direct web search: a real, findable identity — LinkedIn (matches name, title, location), GitHub (19 public repos, 8 followers, mostly forks/starters), X/Twitter, Bluesky, and a Buy Me a Coffee page. No Wikipedia/Wikidata entity, no press or media mentions, no client testimonials or reviews found anywhere on the open web, no Reddit or community-forum presence tied to the name. This is a coherent but thin identity graph — enough for AI systems to confirm "this person exists and does what they say," not enough to independently validate authority or trustworthiness beyond the person's own claims.

### Content E-E-A-T (40/100)
The bio is specific and personally credible (named booking engines, USSA ski-coaching detail adds authenticity) but structurally thin: no case studies, no "problem → approach → outcome" narratives, no metrics, no dated content, no verifiable link to the claimed "Blend Marketing" employer, and the single-page format means there's no supporting body of work (writing, talks, linked projects) to demonstrate expertise beyond the bio's own claims.

### Technical GEO (85/100, adjusted from subagent's 90 to reflect the llms-full.txt gap)
This is the strongest category by far. Full SSR — curl-fetched content matches what a browser renders, meaning AI crawlers see 100% of the bio text with no JS dependency. Clean single-URL sitemap, permissive robots.txt, complete Open Graph/Twitter meta, working content negotiation. The gaps (no security headers, no HTML-level Cache-Control, no resource hints) are real but low-severity relative to the crawlability/rendering fundamentals, which are excellent.

### Schema & Structured Data (64/100)
Valid JSON-LD (WebSite, WebPage, Person, FAQPage), correctly using `@id` references to avoid node duplication (a good practice, not just an absence of errors). Held back by: `CreativeWork` properties misapplied to `Person`, a disconnected `worksFor` stub, `WebPage` where `ProfilePage` would be more precise, and no `Service`/`OfferCatalog` schema despite explicit, easily-structured service offerings already written out in the FAQ answers.

### Platform Optimization (49/100)
Bing Copilot (63) and ChatGPT (62) are in reasonable shape thanks to permissive crawler access and llms.txt. Perplexity (50) and Google AI Overviews (43) are held back by the lack of topical depth and freshness signals. Gemini (25, critical) has essentially no lever pulled yet — no YouTube, no Google Business Profile, no Google-recognized entity anchor.

---

## Quick Wins (Implement This Week)

1. Render the FAQ content visibly on-page (not just in JSON-LD) — single highest-leverage citability fix available.
2. Fix or remove the broken `/llms-full.txt` reference.
3. Add `dateModified` to `WebPage`/`ProfilePage` schema and correct `copyrightYear` to 2026 — improves ChatGPT, Perplexity, and Bing simultaneously for near-zero effort.
4. Add a bolded, standalone "identity block" sentence near the top of the bio (name, location, specialty, named clients/engines) designed to be quoted verbatim.
5. Add basic security headers (`HSTS`, `X-Content-Type-Options`, `Referrer-Policy`) via `public/_headers`.

## 30-Day Action Plan

### Week 1: Close the citability/schema gaps
- [ ] Make FAQ content visible on-page, not just in schema
- [ ] Fix/remove `llms-full.txt`
- [ ] Add `dateModified`, fix `copyrightYear`
- [ ] Add security headers to `public/_headers`

### Week 2: Strengthen schema precision
- [ ] Convert `WebPage` → `ProfilePage` with `mainEntity` → Person
- [ ] Move `copyrightHolder`/`copyrightYear`/`publishingPrinciples` off `Person` onto `ProfilePage`
- [ ] Add `Service`/`OfferCatalog` schema for named service offerings
- [ ] Flesh out or remove the `worksFor` Organization stub

### Week 3: Build content depth
- [ ] Write 2-3 short case studies (problem → stack → outcome), even anonymized
- [ ] Pin 2-3 real (non-fork) GitHub repos and link them from the site
- [ ] Add 1-2 testimonials/recommendations (LinkedIn recs, with permission)

### Week 4: Build external authority
- [ ] Register a Wikidata item (lowest-effort entity anchor available)
- [ ] Cross-check/complete LinkedIn and GitHub profile consistency with site claims
- [ ] Evaluate a short intro video (YouTube) if pursuing Gemini/local visibility
- [ ] Verify domain in Bing Webmaster Tools (`msvalidate.01`)

---

## Appendix: Pages Analyzed

| URL | Title | GEO Issues |
|---|---|---|
| `/` (homepage, only indexed page) | Jasper Kooij - Full Stack Developer | 6 High, 9 Medium, 5 Low |

**Note:** This is a deliberately single-page site. Several findings above (topical depth, freshness, case studies) reflect the inherent limits of a one-page format rather than execution defects — worth weighing against the intentional simplicity of a personal portfolio before treating every gap as something to fix.
