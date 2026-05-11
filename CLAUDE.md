# CLAUDE.md — Project Memory for Leah Budik Architecture

> **For every Claude session:** read this file first. It contains the complete vision, current state, and conventions for this project. Don't make assumptions — read here, then ask if anything is unclear.

---

## 1. Who & What

**Project:** Premium portfolio website + admin panel for **Leah Budik** (לאה בודיק), an Israeli architect and interior designer based in Tel Aviv.

**Owner / Primary user:** Israel Budik (Leah's husband). Communicates in **Hebrew**. The site itself is in **Hebrew (RTL)**.

**Brand DNA — "Quiet Architecture" (אדריכלות שקטה):**
- Minimalist luxury, not loud or showy
- Natural materials: walnut, marble (Arabescato), travertine, oak, stone
- Hidden warm lighting (LED strips), brushed brass accents
- Italian / Japandi / Mediterranean influences
- Precision and restraint over volume
- Clients describe her work in one word: **נכון** ("right" / "true")

**Voice on site:**
- Hebrew first, English for editorial labels (`Atelier of Architecture & Interiors`)
- Last-word italic gold for emphasis (`אדריכלות של **שקט**`)
- Calm, confident, no exclamation marks

---

## 2. Live URLs

- **Public site:** https://architecture-vuqu.onrender.com
- **Admin panel:** https://architecture-vuqu.onrender.com/admin
- **GitHub repo:** https://github.com/leah-budik/architecture
- **MongoDB Atlas:** cluster in **Frankfurt** (eu-central-1) — was migrated from Bahrain after a major AWS outage in March 2026
- **Cloudinary:** cloud name `dauhmodb5`, folder `leah-budik/`
- **Replicate:** account `leah-budik`, used for AI Studio generations

---

## 3. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| **Backend** | Node.js + Express 4 | Single `server.js`, ~1000 lines, monolithic by design |
| **DB** | MongoDB Atlas (Mongoose 8) | Models in `/models/` |
| **File storage** | Cloudinary (multer-storage-cloudinary) | Uploaders in `/config/cloudinary.js` |
| **Frontend** | Vanilla HTML / CSS / JS — **NO build step** | RTL Hebrew, mobile-first responsive |
| **Hosting** | Render (Free tier currently — should upgrade to Starter $7/mo before launch) | Auto-deploys on push to `master` |
| **Auth** | express-session (cookie-based), admin only | Single user — `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars |
| **Security** | helmet (CSP), express-rate-limit (login 5/15min) | See section 7 |
| **AI** | Replicate API (Node SDK) — model `adirik/interior-design` | `/config/replicate.js` |

**Do not introduce React, Next.js, TypeScript, or a build step without explicit approval.** Vanilla JS is a deliberate choice — keeps deploys instant, codebase tiny, and Israel can debug in browser DevTools without tooling.

---

## 4. Repository Map

```
/
├── CLAUDE.md                ← this file
├── .claude/rules/           ← topic-specific rules
├── server.js                ← Express app + all routes
├── package.json
├── index.html               ← public homepage (the redesigned luxury site)
├── gallery.html             ← per-project gallery page
├── index-old.html           ← BACKUP, do not modify
├── gallery-old.html         ← BACKUP, do not modify
├── /public/
│   ├── /css/
│   │   ├── style.css        ← active stylesheet
│   │   └── style-old.css    ← BACKUP, do not modify
│   └── /js/
│       ├── script.js        ← public-site frontend
│       ├── gallery.js       ← gallery-page frontend
│       ├── script-old.js    ← BACKUP, do not modify
│       └── gallery-old.js   ← BACKUP, do not modify
├── /admin/
│   ├── dashboard.html       ← admin UI shell
│   ├── login.html
│   ├── admin.css
│   └── admin.js             ← admin UI logic
├── /config/
│   ├── database.js          ← Mongo connection (with retry/backoff)
│   ├── cloudinary.js        ← Cloudinary uploaders
│   └── replicate.js         ← Replicate client + Prompt Sandwich logic
└── /models/
    ├── SiteContent.js       ← single-document content (hero/about/contact/etc)
    ├── Gallery.js           ← user-uploaded project galleries
    ├── DesignJob.js         ← AI Studio: each generation job
    └── StylePreset.js       ← AI Studio: 5 Leah-curated style presets
```

**Backup files (`*-old.*`)**: kept for rollback. **Never modify, never delete** without explicit approval. They are the "undo button" for the redesign.

---

## 5. Environment Variables (Render)

All in Render Dashboard → Environment. **Never** put any of these in `.env` committed to git.

| Var | Purpose |
|---|---|
| `MONGODB_URI` | Atlas Frankfurt connection string |
| `CLOUDINARY_CLOUD_NAME` | `dauhmodb5` |
| `CLOUDINARY_API_KEY` | Cloudinary auth |
| `CLOUDINARY_API_SECRET` | Cloudinary auth |
| `ADMIN_USERNAME` | Admin login (NOT `admin`) |
| `ADMIN_PASSWORD` | Admin login (strong password) |
| `SESSION_SECRET` | Express session signing (64+ chars random) |
| `REPLICATE_API_TOKEN` | AI Studio generations |
| `NODE_ENV` | `production` |
| `PORT` | Render sets automatically |

`.env` is in `.gitignore` and untracked. Local dev only.

---

## 6. Deploy Workflow

**Render auto-deploys on push to `master`.** ~2-3 minute cycle.

**Known issue:** direct `git push origin master` from this Claude environment intermittently returns HTTP 403 (Render git proxy quirk). When that happens:
1. Push to a side branch: `git push origin HEAD:tmp-feature-branch`
2. Open a PR `tmp-feature-branch → master` on GitHub
3. Merge it manually (squash or merge commit, doesn't matter)
4. Locally: `git fetch origin && git reset --hard origin/master`
5. Delete the side branch via GitHub UI (deleting via `git push --delete` also hits the 403)

**The user's general rule:** do NOT create PRs unless explicitly asked OR push-to-master is blocked. The PR workaround above is the documented exception.

---

## 7. Security Posture (current)

✅ Hardened (do not weaken without discussion):
- helmet with custom CSP allowing Cloudinary, Google Fonts, Fontshare
- `script-src-attr 'unsafe-inline'` enabled (admin panel uses inline `onclick`s — refactoring all is high-risk; trade-off documented in commit `fix(csp)`)
- Rate limit on `POST /api/auth/login`: 5 attempts per 15 min per IP (HTTP 429 thereafter)
- Session cookie: `httpOnly`, `sameSite: lax`, `secure: true` in prod, `name: 'lb.sid'`
- Session ID regenerated on successful login (anti-fixation)
- `SESSION_SECRET` enforced at boot — server refuses to start if missing/short/default
- Admin login refuses if `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars unset (no `admin/admin123` fallback)
- `.env` removed from git tracking; secrets only in Render env
- Cloudinary upload size limit: 10MB; file-type allowlist

⚠️ Still recommended (not blocking launch):
- Rotate the MongoDB password (was exposed in chat)
- Rotate the Cloudinary API secret (was exposed in chat)
- Add CSRF tokens for admin write operations (medium priority)
- Add Helmet CSP nonce + remove `unsafe-inline` for scripts (high effort)

---

## 8. AI Studio — "The Visionary" / Future "ArchiFlow" SaaS

**Vision:** Premium AI architectural visualization tool. Customer uploads a photo of their room → applies Leah's curated style preset → gets a magazine-quality render of how that room could look transformed in her aesthetic.

**Business model:** lead generation (free) + future SaaS spinoff (multi-tenant white-label for other designers).

**Technical approach:**
- Replicate API + `adirik/interior-design` (SDXL + ControlNet ensemble internally)
- "Prompt Sandwich" architecture: Quality-layer + Style-layer + Custom + Negative-layer
- ControlNet preserves room geometry (depth + M-LSD); denoise 0.75-0.80 keeps walls stable while changing materials/furniture
- All preset data stored in Mongo (`StylePreset` model) — never hardcoded — so future tenants can swap presets without redeploy
- Multi-tenant from day 1 (`tenantSlug` field on every record, default `'leahbudik'`)

**The 5 Leah Budik presets (seeded automatically):**

| slug | Hebrew name | Theme |
|---|---|---|
| `quiet-luxury` | החתימה של לאה | Walnut, Arabescato marble, hidden lighting |
| `japandi` | חמימות נורדית | Light oak, travertine, Zen minimalism |
| `modern-classic` | יוקרה על-זמנית | Subtle moldings, brass details, symmetry |
| `industrial` | לופט מעודן | Concrete, slim steel, warm wood balance |
| `mediterranean` | אור ים-תיכוני | Whitewashed stone, huge vitrines, airy |

**Phased roadmap:**
- **Phase 1 (in progress):** Style Transformation — upload + preset → result
- **Phase 2:** Structural intervention — masking, wall removal, window changes (SAM-based)
- **Phase 3:** Scale-aware outpainting — "expand wall by 2m", reference line calibration, blueprint integration

---

## 9. AI Studio — Sprint Tracker

> **When you complete a sprint day, update this section in the same commit.**

### Sprint 1 — Style Transformation MVP (admin-only)

| Day | Status | Notes |
|---|---|---|
| **Day 1: Backend foundation** | ✅ DONE | PR #1 merged. Models, routes, prompt sandwich, preset seeder all live. Smoke-tested locally. |
| **Day 2+3 (merged): Admin UI** | ✅ DONE | New "סטודיו AI" section in admin sidebar. Upload + preset picker (5 cards) + custom textarea + generate button + progress + before/after slider + history grid. All scoped under `.ai-studio` and `window.AIStudio` so nothing leaks. End-to-end real generation against Replicate verified live. |
| **Day 4: Reference Line UI** | ⏳ NEXT | Canvas overlay for calibration line (prep for Phase 2). Schema already has `referenceLine` subdocument. |
| **Day 5: Polish + 5 thumbnail images for presets** | ⏳ planned | Final QA, lead capture form, optional cost reporting in admin |

### What's already built (committed to master)

**Backend (Day 1):**
- `models/DesignJob.js` — generation lifecycle tracking
- `models/StylePreset.js` — preset schema + 5-preset seeder
- `config/replicate.js` — `buildPrompt(preset, custom)`, `startGeneration(...)`, `getPredictionStatus(id)`, `cancelPrediction(id)`. Constants `QUALITY_LAYER` and `NEGATIVE_LAYER` are global; presets can override per `promptLayers.qualityOverride / negativeOverride`.
- Routes (all `requireAuth` except webhook):
  - `GET  /api/v1/design/presets`
  - `POST /api/v1/design/generate`
  - `GET  /api/v1/design/jobs/:jobId`
  - `GET  /api/v1/design/jobs` (history, cursor-paginated)
  - `POST /api/v1/design/webhook` (Replicate callback, no auth)
- `applyPredictionResult(job, pred)` — shared lifecycle handler used by webhook AND the on-demand status reconciliation in `GET /jobs/:jobId`

**Admin UI (Day 2+3):**
- New sidebar entry "סטודיו AI" with BETA badge (`data-section="ai-studio"`)
- New section `#section-ai-studio` in `admin/dashboard.html` — uses existing `.card`, `.btn`, `.form-textarea` patterns plus AI-specific scoped classes
- All AI-specific CSS appended to `admin/admin.css` under the `.ai-studio` namespace (no edits to existing tokens)
- All AI-specific JS appended to `admin/admin.js` inside `window.AIStudio` IIFE, activated lazily when the section opens
- New route: `POST /api/v1/design/upload` — accepts a single room photo, stores in Cloudinary `leah-budik/design-inputs/`, returns URL
- `uploaders.designInput` added to `config/cloudinary.js`

### Not yet built

- Reference Line canvas overlay (Day 4)
- Webhook signature verification (Replicate supports HMAC) — TODO before public launch
- Lead-capture form (post-result)
- Thumbnail images for the 5 presets (admin upload UI + StylePreset.thumbnailUrl)
- Cost reporting in admin (Replicate billing API integration)

---

## 10. Working Style — How to Talk to the User

- **Language:** Hebrew, with English technical terms (commit messages can stay English).
- **Pace:** Small, verifiable steps. Get confirmation before risky changes.
- **Visibility:** Show what you're about to do before doing it; report what changed afterward.
- **Honesty:** If something fails, say so plainly. Don't hide errors. The user prefers transparent over polished.
- **Backups:** Always preserve old versions before rewriting (the `*-old.*` files exist for this reason).
- **Confirmation needed before:**
  - Force pushes, branch deletions, history rewrites
  - Database schema changes that drop fields
  - Irreversible Cloudinary deletions
  - Any operation touching production secrets
  - Creating PRs (unless push-to-master is blocked — see section 6)

---

## 11. Patterns & Conventions

- **API versioning:** new public APIs go under `/api/v1/...`. Old `/api/...` routes (content, galleries, testimonials) stay as-is for backward compat.
- **Schema field for multi-tenant:** every NEW model gets `tenantSlug: { type: String, default: 'leahbudik', index: true }`. Future-proofing for ArchiFlow SaaS.
- **Public IDs:** never expose Mongo `_id` to the client. Use generated short IDs (e.g. `DesignJob.newJobId() → 'job_<8 hex>'`).
- **Defensive frontend:** every render function in `script.js` and `gallery.js` is wrapped in try/catch and degrades gracefully if its data is missing. Never assume content from `/api/content` is fully populated.
- **CSS naming:** mix of BEM-style (`.mobile-drawer__list`) and utility (`.gold`, `.fill`). Don't refactor naming for its own sake.
- **Israeli date/phone formatting:** always use the user-facing display version stored in DB (e.g. `contact.phoneDisplay`) for rendering, the canonical version (`contact.phone`) for `tel:` links.

---

## 12. Decision Log (newest first)

- **2026-05-11** AI Studio Day 2+3 — admin UI added. The visual language was sketched via Claude Design (claude.ai/design) for inspiration only; final markup uses the existing admin `.card`/`.btn`/`.form-*` system, with AI-specific styling fully scoped under `.ai-studio` so nothing leaks. The Claude Design output was deliberately NOT used directly (it used React + decorative elements that don't match our vanilla-JS admin shell).
- **2026-05-11** Day 1 of AI Studio backend merged via PR #1 (direct push to master was 403'd; PR workaround documented in §6).
- **2026-05-11** Mobile drawer redesigned from full-screen overlay to side panel (320px / 85vw) with X close button + backdrop, matching admin sidebar pattern.
- **2026-05-11** Marquee `direction: ltr` forced on `.marquee` parent — RTL was right-aligning the inline-flex track, leaving an empty patch on the right after each translate cycle. Now seamless.
- **2026-05-11** Marquee animation duration computed dynamically from track width (`PX_PER_SEC = 70`), so scroll speed is consistent regardless of word count.
- **2026-05-11** Hero title `.stroke` text bumped to 2px white outline + soft text-shadow for legibility against bright photos.
- **2026-05-11** Switched typography to **Rubik** (was Heebo + Playfair Display).
- **2026-05-11** Hero image carousel restored — was lost in the redesign, now cycles all uploaded hero images at 6s intervals with 1.5s cross-fade.
- **2026-05-11** `.project-media` made `display: block` — it's an `<a>` and inline `aspect-ratio` was collapsing tile heights to 0.
- **2026-05-11** Helmet + express-rate-limit + cookie hardening committed.
- **2026-05-11** Admin panel: new section "כותרות סקציות" added so projects/testimonials titles are editable.
- **2026-05-11** Schema extensions: `hero.titleHighlight`, `hero.tagline`, `hero.sideText`, `hero.megaText`, `about.titleLines[]`, `about.signature`, `about.signatureRole`, `contact.address`, `contact.addressLabel`, `contact.ctaText`, `footer.socials[]`, `marquee.items[]`, `sections.testimonialsLabel`, `sections.testimonialsTitle`.
- **2026-05-11** Gallery page (`gallery.html`) rebuilt from scratch in the new design language. Old preserved as `gallery-old.html`.
- **2026-05-11** Site fully redesigned ("Atelier of Quiet Architecture" theme). All content dynamic from `/api/content` and `/api/galleries`. Old design preserved as `index-old.html` etc.
- **2026-05-11** `.env` removed from git tracking; `.gitignore` added.
- **2026-05-11** MongoDB connection resilience fix merged (timeout 5s → 30s, exponential backoff retry, server starts even if Mongo unreachable, new `/api/health` endpoint).
- **2026-05-11** MongoDB cluster migrated from Bahrain (frozen by AWS outage) to a fresh free cluster in Frankfurt. All previous gallery metadata was lost; photos themselves remain in Cloudinary and need to be re-linked via the admin panel.

---

## 13. Open Questions / Pending User Decisions

- Decide upgrade to Render Starter ($7/mo) before launching to real customers — Free tier 50s cold-start will hurt conversion.
- Decide on og-image.jpg for social sharing (currently 404).
- Decide custom domain vs. `architecture-vuqu.onrender.com`.
- Rotate exposed credentials (MongoDB password, Cloudinary API secret).
- Confirm AI Studio monetization model: free lead-gen only / freemium / paid PDF report tier.
