# Data Shapes — Mongo Schemas Quick Reference

Full schemas live in `/models/`. This file is a fast lookup so you don't
have to re-read 4 files at the start of every session.

## SiteContent (single document, one per tenant)

The entire editable text/image content of the public site lives in ONE
document. Frontend fetches via `GET /api/content`.

```
{
  logo: { main, mainPublicId, light, lightPublicId, favicon, faviconPublicId },
  hero: {
    subtitle, title[],            // title is array of lines
    titleHighlight,               // word in line 2 that gets gold italic
    description, ctaText, tagline,
    sideText,                     // vertical "EST. 2009 — TEL AVIV"
    megaText,                     // huge "LB" watermark
    images[]                      // carousel, cycles every 6s
  },
  about: {
    label, title,                 // legacy single-string
    titleLines[],                 // NEW preferred: array of lines, last word italic gold
    lead, text, moreText,
    image, imagePublicId,
    signature, signatureRole,
    stats[]                       // up to 4 {number, label}
  },
  quotes[],                       // legacy from old design
  projects: { label, title, featured[] },
  testimonials[],                 // {id, text, shortText, authorName, authorRole, isActive, ...}
  contact: {
    label, title, description,
    whatsapp, whatsappDisplay,
    phone, phoneDisplay,
    email, address, addressLabel,
    visualText, ctaText
  },
  footer: {
    tagline, copyright,
    creditName, creditPhone,
    socials[]                     // [{name, url}], filtered: only entries with url
  },
  seo: { title, description, keywords },
  marquee: { items[] },           // strings shown in the rolling banner
  categories[],                   // [{key, label}] — for project filter buttons
  sections: {
    testimonialsLabel,            // small mark over testimonials title
    testimonialsTitle             // the heading itself
  }
}
```

## Gallery (N documents, one per project)

```
{
  id,                             // public string id "gallery-<timestamp>"
  name, category, description,
  folder,                         // Cloudinary folder name
  isActive, isFeatured, order,
  coverImage, coverImagePublicId,
  images[]                        // {id, filename, path (Cloudinary URL), publicId, ...}
}
```

## DesignJob (AI Studio — N documents, one per generation)

```
{
  jobId,                          // "job_<8 hex>" — public id, never expose _id
  tenantSlug: 'leahbudik',
  inputImageUrl, inputImagePublicId,
  presetSlug,
  customAddition,
  referenceLine: { startX, startY, endX, endY, realMeters, objectLabel },
  predictionId,                   // Replicate's id
  promptUsed,                     // for debugging
  status,                         // queued | running | done | failed | cancelled
  progress, error,
  resultImageUrl, resultImagePublicId,
  costUsd,
  lead: { name, email, phone, capturedAt, notes },
  createdAt, startedAt, completedAt
}
```

## StylePreset (AI Studio — 5 documents seeded automatically)

```
{
  tenantSlug: 'leahbudik',
  slug,                           // "quiet-luxury", "japandi", "modern-classic", "industrial", "mediterranean"
  displayName, description, category,
  thumbnailUrl,
  isActive, order,
  promptLayers: {
    style,                        // the middle of the prompt sandwich
    qualityOverride,              // optional, defaults to global QUALITY_LAYER
    negativeOverride              // optional, defaults to global NEGATIVE_LAYER
  },
  controlnet: { depth, mlsd, denoise }
}
```

`StylePreset.seedIfMissing()` runs on every successful Mongo connection.
Idempotent — won't overwrite presets the admin has tuned. To re-seed
fresh, delete the document via Atlas UI and restart.
