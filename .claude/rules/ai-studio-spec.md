# AI Studio — Technical Spec & Sprint Plan

## Master Vision

Premium AI architectural visualization tool. Phase 1 inside Leah's site
(admin-only), eventually spinning off as **ArchiFlow** — a multi-tenant
SaaS for designers (white-label).

## Phased Roadmap

| Phase | Feature | Target |
|---|---|---|
| **Phase 1** | Style Transformation: photo → preset → render | Leah's site, admin-only first, then public |
| **Phase 2** | Structural intervention: SAM-based masking, wall removal, vitrine swaps | Leah's site, public |
| **Phase 3** | Scale-aware outpainting: "expand by 2m", reference-line calibration, blueprint sync | ArchiFlow SaaS launch |

## Prompt Sandwich (immutable contract)

```
Top    : QUALITY_LAYER       (fixed, in config/replicate.js)
Middle : preset.style + custom-text  (preset from DB, custom from user)
Bottom : NEGATIVE_LAYER      (fixed, in config/replicate.js)
```

`QUALITY_LAYER` and `NEGATIVE_LAYER` live in `config/replicate.js` as
exported constants. **Don't edit per request.** A preset MAY override
either via `promptLayers.qualityOverride` / `negativeOverride` in
`StylePreset` schema, but global defaults are global.

## ControlNet Settings (architectural stability)

Goal: walls, windows, ceiling, floor outline 100% stable. Materials,
furniture, lighting, color treatment fully transformable.

Per-preset settings stored on `StylePreset.controlnet`:
- `depth: 1.0` — mandatory
- `mlsd: 0.7-0.8` — preserves architectural lines
- `denoise: 0.75-0.80` — sweet spot. Below 0.7 = too similar to input. Above 0.85 = walls warp.

Currently using model `adirik/interior-design` on Replicate which bundles
the ControlNet ensemble internally. If we ever need fine-grained per-CN
control, switch to a generic SDXL pipeline like `lucataco/sdxl-controlnet`
and pass our own conditioning images. Not needed for Phase 1.

## API Contract

Versioned at `/api/v1/design/...` from day 1 (so we can break v1 later
without breaking customers).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/design/presets` | requireAuth | List active presets |
| POST | `/api/v1/design/generate` | requireAuth | Start a job, returns `{jobId}` |
| GET | `/api/v1/design/jobs/:jobId` | requireAuth | Poll status (with on-demand reconcile) |
| GET | `/api/v1/design/jobs` | requireAuth | Admin history, cursor-paginated |
| POST | `/api/v1/design/webhook` | NONE (Replicate callback) | Lifecycle update |

## Multi-Tenant Readiness

Every AI Studio model has `tenantSlug: { type: String, default: 'leahbudik', index: true }`.
Routes hardcode `'leahbudik'` for now. When ArchiFlow launches:
- Resolve tenant from subdomain or `X-Tenant-ID` header
- Replace hardcoded `'leahbudik'` lookups with the resolved slug
- No schema migration needed

## Webhook Security (TODO before public launch)

Replicate supports HMAC-SHA256 signature on webhooks. Currently we trust
the body. Before opening this to the public:
1. Configure a webhook signing secret in Replicate dashboard
2. Verify `Webhook-Signature` header in `POST /api/v1/design/webhook`
3. Reject unsigned / bad-signed requests

## Cost Management

Replicate `adirik/interior-design`: ~$0.02-0.04 per generation.
- Free tier credit: $5-10 from Replicate signup
- Estimated 100 generations/month → $3-5/month
- Need to add admin dashboard showing monthly spend before opening to public.
