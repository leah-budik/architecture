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
// v4 rewrite — each preset is ONE short line: style name + 3-4 anchor
// materials. The model already knows what "industrial loft" or "modern
// classicism" looks like — we don't need to describe them. The lock
// on what to keep / change is enforced by buildPrompt() in
// config/replicate.js, not by the preset text.
// ─────────────────────────────────────────────────────────────────────
const SEED_PROMPT_VERSION = 4;

const SEED_PRESETS = [
    {
        slug: 'quiet-luxury',
        displayName: 'החתימה של לאה',
        description: 'Walnut, Arabescato marble, hidden lighting',
        category: 'minimalist-luxury',
        order: 1,
        promptLayers: {
            style:
                'warm Italian quiet-luxury minimalism — rich walnut wood, ' +
                'polished white Arabescato marble (with soft grey veining), ' +
                'brushed antique brass hardware, hidden warm-LED lighting'
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
                'Japandi — Japanese-Scandinavian minimalism with pale white ' +
                'oak, warm cream travertine, undyed natural linen and ' +
                'rice-paper pendant lighting'
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
                'modern classicism — symmetric timeless luxury with polished ' +
                'Calacatta marble, brushed antique brass details, subtle ' +
                'painted wall moldings and crystal lighting'
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
                'refined industrial loft — polished microcement, slim black ' +
                'steel framing, warm walnut joinery, aged tan leather, ' +
                'precise architectural track lighting'
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
                'modern Mediterranean coastal calm — whitewashed plaster ' +
                'walls, honed creamy limestone, bleached oak joinery and ' +
                'abundant natural Mediterranean sunlight'
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
