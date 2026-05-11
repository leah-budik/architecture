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
// v3 rewrite — shorter, room-agnostic, structured.
//
// Each preset uses the same 4-block structure so Flux Kontext can parse
// it as discrete directives rather than a wall of prose:
//   Materials → Lighting → Palette → Mood
//
// Items named are aesthetic targets (cabinets, countertops, hardware,
// fixtures, fabrics) NOT specific furniture types — the previous v2
// prompts mentioned "sofas" and "wide-plank flooring" which derailed
// the model on kitchens and bathrooms.
// ─────────────────────────────────────────────────────────────────────
const SEED_PROMPT_VERSION = 3;

const SEED_PRESETS = [
    {
        slug: 'quiet-luxury',
        displayName: 'החתימה של לאה',
        description: 'Walnut, Arabescato marble, hidden lighting',
        category: 'minimalist-luxury',
        order: 1,
        promptLayers: {
            style:
                'Quiet-luxury Italian minimalism, the signature of Leah Budik. ' +
                'Materials: book-matched dark walnut wood with visible vertical ' +
                'grain on cabinetry and joinery; polished Arabescato marble ' +
                '(white with soft grey veining) on every visible countertop, ' +
                'backsplash and feature surface; brushed antique-brass hardware ' +
                'and slim edge pulls; ivory wool or cream linen upholstery. ' +
                'Lighting: hidden warm-white LED strips under upper cabinetry, ' +
                'shelving and ceiling reveals; one sculptural alabaster pendant; ' +
                'no visible can lights. Palette: warm ivory, dark walnut, soft ' +
                'taupe, single brushed-brass accent. Mood: hushed, intimate, ' +
                'lived-in restraint — never showy, never glossy.'
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
                'Japandi — Japanese minimalism crossed with Scandinavian warmth. ' +
                'Materials: pale white-oak with visible grain on cabinetry, ' +
                'shelving and flooring; warm cream travertine on countertops, ' +
                'backsplashes and feature walls; undyed natural linen fabrics; ' +
                'hand-thrown ceramic accents; oiled raw wood. Lighting: one ' +
                'large rice-paper pendant; hidden warm LED strips on shelving; ' +
                'soft diffused window light. Palette: bone white, pale oak, ' +
                'soft sand, gentle moss-green accent, single charcoal note. ' +
                'Mood: serene wabi-sabi calm, empty space treated as an ' +
                'intentional design element.'
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
                'Modern classicism — restrained timeless luxury. Materials: ' +
                'subtle painted wall moldings and panel work in soft off-white; ' +
                'large-format polished Calacatta marble on countertops, floors ' +
                'or a single feature wall; brushed antique-brass hardware on ' +
                'built-ins; silk-blend cream drapery; tailored bouclé and ' +
                'velvet upholstery. Lighting: a matching pair of crystal-and-brass ' +
                'sconces; one sculptural hand-blown glass chandelier; hidden cove ' +
                'lighting. Palette: warm ivory, ecru, polished brass, pale ' +
                'dove-grey marble. Mood: composed, symmetric, ageless.'
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
                'Refined industrial loft — softened, never raw. Materials: ' +
                'polished microcement floors with subtle grey mottle; matte ' +
                'concrete feature wall; slim black-steel framing on glass ' +
                'openings and shelving; warm walnut joinery, cabinetry and ' +
                'shelving balancing the cool concrete; aged tan-leather ' +
                'upholstery; brushed-steel accents. Lighting: black architectural ' +
                'track spots aimed precisely; one oversized blackened-brass ' +
                'pendant; hidden LED under cantilevered shelves. Palette: cool ' +
                'grey concrete, deep walnut, black steel, warm tan leather. ' +
                'Mood: confident urban, warmed by wood and leather — never cold.'
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
                'Modern Mediterranean — Tel-Aviv coastal calm. Materials: ' +
                'whitewashed plaster walls with subtle hand-applied texture; ' +
                'honed creamy limestone floors and countertops; bleached-oak ' +
                'cabinetry and joinery; slim black-framed glass openings ' +
                'flooding the space with daylight; natural-linen drapery in ' +
                'oatmeal. Lighting: brilliant natural Mediterranean afternoon ' +
                'sun through large openings; one rattan or paper pendant; ' +
                'hidden warm LED on shelving. Palette: bone white, sand, ' +
                'bleached oak, soft sage, single terracotta accent. Mood: ' +
                'serene sun-drenched — interior dissolves into landscape.'
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
