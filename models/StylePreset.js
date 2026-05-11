/**
 * StylePreset Model
 * Each preset is the "middle layer" of the Prompt Sandwich. Stored as data
 * (not code) so that:
 *  - Admin can tune wording without redeploy
 *  - Different tenants (Phase 3 SaaS) can have their own preset library
 *  - A/B testing of prompt variations is trivial
 *
 * The fixed ARCHITECTURAL_LOCK, QUALITY_LAYER and NEGATIVE_GUIDANCE live
 * in config/replicate.js because they apply globally and should never be
 * edited per-preset.
 *
 * Note on `controlnet`: kept on the schema for backward compatibility with
 * existing seeded records, but the active model (Flux Kontext Max) is
 * instruction-based and does NOT consume these values. Safe to ignore on
 * new presets.
 */

const mongoose = require('mongoose');

const PromptLayersSchema = new mongoose.Schema({
    style: { type: String, required: true },        // the actual style description
    qualityOverride: { type: String, default: '' }, // optional, defaults to global
    negativeOverride: { type: String, default: '' } // optional, defaults to global
}, { _id: false });

const ControlNetSettingsSchema = new mongoose.Schema({
    depth: { type: Number, default: 1.0 },
    mlsd: { type: Number, default: 0.75 },
    denoise: { type: Number, default: 0.78 }
}, { _id: false });

const StylePresetSchema = new mongoose.Schema({
    tenantSlug: { type: String, default: 'leahbudik', index: true },
    slug: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    promptLayers: { type: PromptLayersSchema, required: true },
    controlnet: { type: ControlNetSettingsSchema, default: () => ({}) },
    // Bumped whenever the canonical seed prompt changes. The seeder uses
    // this to auto-upgrade existing presets in Mongo without overwriting
    // any field other than promptLayers.style.
    //   v1 — original SDXL-tuned short prompts
    //   v2 — rewritten for Flux Kontext Max (rich editorial prose)
    promptVersion: { type: Number, default: 1 }
}, {
    timestamps: true,
    collection: 'stylepresets'
});

StylePresetSchema.index({ tenantSlug: 1, slug: 1 }, { unique: true });

StylePresetSchema.methods.toClientJSON = function () {
    return {
        id: this.slug,
        displayName: this.displayName,
        description: this.description,
        category: this.category,
        thumbnailUrl: this.thumbnailUrl,
        order: this.order
    };
};

// ─────────────────────────────────────────────────────────────────────
// Seed data — the 5 Leah Budik presets, per the brand DNA in CLAUDE.md.
//
// Prompts are written in English (Flux Kontext understands English best)
// in editorial prose, naming specific materials, fixtures and palette so
// the model has concrete visual targets rather than abstract adjectives.
//
// Each preset starts with "Apply a <X> interior aesthetic" — this framing
// reads as an instruction to Flux Kontext, which is an instruction-tuned
// image editor. The structure inside is intentional:
//   Surfaces and finishes → Lighting → Furniture → Palette → Mood
// ─────────────────────────────────────────────────────────────────────
const SEED_PROMPT_VERSION = 2;

const SEED_PRESETS = [
    {
        slug: 'quiet-luxury',
        displayName: 'החתימה של לאה',
        description: 'Walnut, Arabescato marble, hidden lighting',
        category: 'minimalist-luxury',
        order: 1,
        promptLayers: {
            style:
                'Apply a quiet-luxury minimalist Italian interior aesthetic. ' +
                'Surfaces and finishes: rich dark walnut wood paneling with visible ' +
                'vertical grain, book-matched white Arabescato marble with soft grey ' +
                'veining in a polished satin finish, brushed antique-brass hardware ' +
                'and trim, cream linen upholstery on low-slung sofas, wide-plank oak ' +
                'flooring. Lighting: hidden warm-white LED strips concealed behind ' +
                'ceiling reveals, discreet recessed pin spots, one sculptural alabaster ' +
                'pendant — no visible can lights. Furniture: low Italian mid-century ' +
                'pieces in restrained scale, generous negative space. Palette: warm ' +
                'off-white walls, walnut tones, ivory, soft taupe, single brushed-brass ' +
                'accent. Mood: hushed, intimate, lived-in luxury — never showy, never ' +
                'glossy.'
        }
    },
    {
        slug: 'japandi',
        displayName: 'חמימות נורדית',
        description: 'Light oak, travertine, Zen minimalism',
        category: 'minimalist',
        order: 2,
        promptLayers: {
            style:
                'Apply a Japandi interior aesthetic — Japanese minimalism crossed ' +
                'with Scandinavian warmth. Surfaces and finishes: pale white-oak ' +
                'flooring and joinery with visible grain, warm cream travertine slab ' +
                'walls or accents, hand-thrown ceramic vessels, undyed natural linen, ' +
                'raw oiled wood. Lighting: large rice-paper pendants, hidden warm ' +
                'LED strips on shelving, soft diffused window light. Furniture: low ' +
                'platform seating, simple turned-wood stools, woven floor cushions, ' +
                'one minimal ikebana arrangement; empty space treated as a deliberate ' +
                'design element. Palette: bone white, pale oak, soft sand, gentle ' +
                'moss green, single charcoal accent. Mood: serene, grounded, ' +
                'wabi-sabi calm — the silence between objects matters.'
        }
    },
    {
        slug: 'modern-classic',
        displayName: 'יוקרה על-זמנית',
        description: 'Subtle moldings, brass details, symmetry',
        category: 'classic-luxury',
        order: 3,
        promptLayers: {
            style:
                'Apply a modern-classicism interior aesthetic — restrained timeless ' +
                'luxury. Surfaces and finishes: subtle painted wall moldings and ' +
                'panel work in soft off-white, large-format polished Calacatta marble ' +
                'floors or a single feature wall, brushed antique-brass hardware on ' +
                'built-in cabinetry, silk-blend drapery in cream, tailored bouclé and ' +
                'velvet upholstery. Lighting: a pair of matching crystal-and-brass ' +
                'sconces flanking the main feature, one sculptural chandelier with ' +
                'hand-blown glass, hidden cove lighting. Furniture: perfectly ' +
                'symmetric layout, fluted millwork, deco-influenced silhouettes. ' +
                'Palette: warm ivory, ecru, polished brass, pale dove-grey marble ' +
                'veining. Mood: composed, elegant, ageless — the kind of room a ' +
                'designer would live in.'
        }
    },
    {
        slug: 'industrial',
        displayName: 'לופט מעודן',
        description: 'Concrete, slim steel, warm wood balance',
        category: 'industrial',
        order: 4,
        promptLayers: {
            style:
                'Apply a refined industrial loft interior aesthetic — softened, ' +
                'never raw. Surfaces and finishes: polished microcement floors with ' +
                'subtle grey mottle, matte concrete feature wall, slim black-steel ' +
                'window frames and Crittall-style screens, warm walnut joinery and ' +
                'shelving to balance the cool concrete, aged tan-leather upholstery, ' +
                'brushed-steel accents. Lighting: black architectural track spots ' +
                'aimed precisely, one oversized industrial pendant in blackened ' +
                'brass, hidden LED under cantilevered shelves. Furniture: mid-century ' +
                'industrial silhouettes, a low leather sofa, vintage Tolix-style ' +
                'stools. Palette: cool grey concrete, deep walnut, black steel, warm ' +
                'tan leather, single ember accent. Mood: confident, urban, masculine ' +
                '— but warmed by wood and leather, never cold.'
        }
    },
    {
        slug: 'mediterranean',
        displayName: 'אור ים-תיכוני',
        description: 'Natural stone, huge vitrines, airy feel',
        category: 'mediterranean',
        order: 5,
        promptLayers: {
            style:
                'Apply a modern Mediterranean interior aesthetic — Tel-Aviv coastal ' +
                'architecture meets Greek-island calm. Surfaces and finishes: ' +
                'whitewashed plaster walls with subtle hand-applied texture, creamy ' +
                'honed limestone floors, bleached-oak joinery, large minimalist ' +
                'black-framed glass vitrines and pivot doors flooding the space with ' +
                'daylight, natural-linen drapery in oatmeal. Lighting: brilliant ' +
                'natural Mediterranean afternoon sun pouring through huge openings; ' +
                'minimal artificial light — only one rattan or paper pendant and ' +
                'hidden warm LED strips on shelving. Furniture: airy low silhouettes, ' +
                'woven rattan, organic-curve plaster benches, a single olive-tree ' +
                'planter. Palette: bone white, sand, bleached oak, soft sage, ' +
                'terracotta accent, glimpses of sky blue outside. Mood: serene, ' +
                'sun-drenched, breathing — the interior dissolves into landscape.'
        }
    }
];

/**
 * Seed missing presets and upgrade out-of-date prompts.
 *
 * Behavior:
 *  - Missing preset → create from seed with current SEED_PROMPT_VERSION.
 *  - Existing preset with older promptVersion → update ONLY promptLayers.style
 *    and bump promptVersion. Leaves displayName, description, thumbnailUrl,
 *    category, order, isActive and any admin-tuned values untouched.
 *  - Existing preset with current promptVersion → no-op.
 *
 * Safe to call on every startup. Idempotent within a version.
 */
StylePresetSchema.statics.seedIfMissing = async function () {
    const tenantSlug = 'leahbudik';
    let inserted = 0;
    let upgraded = 0;
    for (const p of SEED_PRESETS) {
        const existing = await this.findOne({ tenantSlug, slug: p.slug });
        if (!existing) {
            await this.create({ tenantSlug, promptVersion: SEED_PROMPT_VERSION, ...p });
            inserted++;
            continue;
        }
        if ((existing.promptVersion || 1) < SEED_PROMPT_VERSION) {
            existing.promptLayers.style = p.promptLayers.style;
            existing.promptVersion = SEED_PROMPT_VERSION;
            await existing.save();
            upgraded++;
        }
    }
    if (inserted > 0) {
        console.log(`StylePreset seeder: inserted ${inserted} new preset(s)`);
    }
    if (upgraded > 0) {
        console.log(`StylePreset seeder: upgraded ${upgraded} preset prompt(s) to v${SEED_PROMPT_VERSION}`);
    }
    return { inserted, upgraded };
};

module.exports = mongoose.model('StylePreset', StylePresetSchema);
