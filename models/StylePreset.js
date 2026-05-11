/**
 * StylePreset Model
 * Each preset is the "middle layer" of the Prompt Sandwich plus its
 * ControlNet weights. Stored as data (not code) so that:
 *  - Admin can tune wording without redeploy
 *  - Different tenants (Phase 3 SaaS) can have their own preset library
 *  - A/B testing of prompt variations is trivial
 *
 * The fixed QUALITY_LAYER and NEGATIVE_LAYER live in config/replicate.js
 * because they apply globally and should never be edited per-preset.
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
    controlnet: { type: ControlNetSettingsSchema, default: () => ({}) }
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
// Seed data — the 5 Leah Budik presets, per the Sprint 1 brief.
// Loaded on server boot if the collection is empty (or if the slug is missing).
// Editing wording later? Edit in admin UI, not here — the seeder won't
// overwrite an existing record.
// ─────────────────────────────────────────────────────────────────────
const SEED_PRESETS = [
    {
        slug: 'quiet-luxury',
        displayName: 'החתימה של לאה',
        description: 'Walnut, Arabescato marble, hidden lighting',
        category: 'minimalist-luxury',
        order: 1,
        promptLayers: {
            style: 'minimalist Italian interior, rich walnut wood textures, ' +
                'white veined Arabescato marble accents, hidden warm LED strip lighting, ' +
                'cream linen upholstery, brushed brass details, calm restrained palette'
        },
        controlnet: { depth: 1.0, mlsd: 0.75, denoise: 0.78 }
    },
    {
        slug: 'japandi',
        displayName: 'חמימות נורדית',
        description: 'Light oak, travertine, Zen minimalism',
        category: 'minimalist',
        order: 2,
        promptLayers: {
            style: 'architectural Japandi interior, light pale oak wood textures, ' +
                'travertine stone accents, soft beige linen fabrics, natural diffused daylight, ' +
                'low Japanese-inspired furniture, paper lanterns, restrained zen palette'
        },
        controlnet: { depth: 1.0, mlsd: 0.78, denoise: 0.76 }
    },
    {
        slug: 'modern-classic',
        displayName: 'יוקרה על-זמנית',
        description: 'Subtle moldings, brass details, symmetry',
        category: 'classic-luxury',
        order: 3,
        promptLayers: {
            style: 'modern classicism interior, subtle elegant wall moldings, ' +
                'perfectly symmetric layout, polished marble stone floors, brushed brass hardware, ' +
                'tailored upholstery, sculptural pendant lighting, refined neutral palette'
        },
        controlnet: { depth: 1.0, mlsd: 0.8, denoise: 0.75 }
    },
    {
        slug: 'industrial',
        displayName: 'לופט מעודן',
        description: 'Concrete, slim steel, warm wood balance',
        category: 'industrial',
        order: 4,
        promptLayers: {
            style: 'luxury industrial loft interior, polished smooth concrete floors and walls, ' +
                'slim black steel window frames, warm walnut wood balance, ' +
                'architectural spot lighting, leather furniture, mid-century industrial palette'
        },
        controlnet: { depth: 1.0, mlsd: 0.7, denoise: 0.8 }
    },
    {
        slug: 'mediterranean',
        displayName: 'אור ים-תיכוני',
        description: 'Natural stone, huge vitrines, airy feel',
        category: 'mediterranean',
        order: 5,
        promptLayers: {
            style: 'modern Mediterranean interior, whitewashed natural stone textures, ' +
                'large minimalist glass vitrines flooding the space with light, ' +
                'seamless internal-external flow, terracotta tiles, light oak details, ' +
                'airy bright palette, Israeli coastal influence'
        },
        controlnet: { depth: 1.0, mlsd: 0.75, denoise: 0.78 }
    }
];

/**
 * Seed missing presets without overwriting any existing tuned values.
 * Safe to call on every startup.
 */
StylePresetSchema.statics.seedIfMissing = async function () {
    const tenantSlug = 'leahbudik';
    let inserted = 0;
    for (const p of SEED_PRESETS) {
        const exists = await this.findOne({ tenantSlug, slug: p.slug });
        if (!exists) {
            await this.create({ tenantSlug, ...p });
            inserted++;
        }
    }
    if (inserted > 0) {
        console.log(`StylePreset seeder: inserted ${inserted} new preset(s)`);
    }
    return inserted;
};

module.exports = mongoose.model('StylePreset', StylePresetSchema);
