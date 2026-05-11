/**
 * Replicate Service
 *
 * Two-stage premium pipeline:
 *   Stage 1 — black-forest-labs/flux-kontext-max  (2025 image editor)
 *   Stage 2 — philz1337x/clarity-upscaler         (detail refinement)
 *
 * Why two stages:
 *  - Flux Kontext Max is a 2025-generation instruction-tuned image editor that
 *    preserves room geometry naturally (no ControlNet needed) and produces
 *    magazine-grade output. It is the same class of model that powers Gemini
 *    Nano-Banana — outputs are comparable.
 *  - Clarity Upscaler runs on top to add micro-detail (wood grain, marble
 *    veining, fabric weave) without altering composition. This is what
 *    differentiates our renders from one-shot models like GPT-Image.
 *
 * Cost per job ≈ $0.08 (generate) + $0.012 (upscale) ≈ $0.092.
 *
 * Why a wrapper instead of calling Replicate inline:
 *  1. Future model upgrades only touch this file.
 *  2. Easier to unit-test prompt construction without hitting the API.
 *  3. Centralized cost accounting & rate-limit handling later.
 */

const Replicate = require('replicate');

// ─────────────────────────────────────────────────────────────────────
// Prompt design (v4) — constraint-driven, not style-explainer
//
// The model already knows what "modern classic" or "industrial loft"
// looks like — these are common training-data terms. Our prompt's job
// is NOT to teach the model the style. Its job is to enforce HARD
// CONSTRAINTS on what may and may not change between input and output.
//
// Composition order:
//   1. TASK line       — single instruction with the style name
//   2. KEEP list       — strict bullets, must remain identical to input
//   3. CHANGE list     — explicit bullets, free to rework in the style
//   4. CLIENT DIRECTION — optional per-request override
//   5. LIGHT & CAMERA  — photography brief
//   6. AVOID           — short failure-mode list
// ─────────────────────────────────────────────────────────────────────

const KEEP_BULLETS = [
    'walls, ceiling, floor outline and all room dimensions',
    'every window and door — same size, same shape, same location',
    'every built-in major appliance and fixture (fridge, oven, gas stove, microwave, sink, dishwasher, toilet, shower, bath) — same model, same position',
    'the view visible through every window',
    'camera angle, perspective and framing — match the input photograph exactly'
];

const CHANGE_BULLETS = [
    'cabinetry, shelving, countertops, backsplashes — finish and material only, not position or footprint',
    'wall finish, paint, wallpaper, panelling',
    'floor finish (material, colour, pattern) — but not the floor outline',
    'all lighting fixtures and the overall lighting mood',
    'all loose furniture, soft furnishings, fabrics, textiles, rugs, plants, accessories',
    'overall colour palette and hardware'
];

const QUALITY_LAYER =
    'Photograph in bright airy natural daylight pouring through the windows, ' +
    'daytime atmosphere, uncluttered editorial composition, true-to-life ' +
    'premium materials, Architectural Digest magazine quality.';

const NEGATIVE_GUIDANCE =
    'dim or evening light, warm orange golden-hour tones, harsh artificial ' +
    'shadows, fake CGI plastic surfaces, oversaturated colors, cluttered ' +
    'staging, instagram filter look, distorted perspective, melted geometry, ' +
    'watermarks, visible text.';

// Kept as a back-compat export — earlier code imported this constant.
// Now derived from KEEP_BULLETS so there is one source of truth.
const ARCHITECTURAL_LOCK =
    'STRICT — keep these identical to the input photograph:\n' +
    KEEP_BULLETS.map(b => '  • ' + b).join('\n');

// ─────────────────────────────────────────────────────────────────────
// Model identifiers
// Both are "official" model slugs on Replicate — the SDK resolves the
// latest deployed version automatically. If we ever need to pin a
// specific version, switch `model:` for `version:` in the create call.
// ─────────────────────────────────────────────────────────────────────
const MODEL_GENERATE = 'black-forest-labs/flux-kontext-max';
const MODEL_UPSCALE = 'philz1337x/clarity-upscaler';

let _replicateClient = null;
function getClient() {
    if (_replicateClient) return _replicateClient;
    if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('REPLICATE_API_TOKEN is not configured');
    }
    _replicateClient = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    return _replicateClient;
}

/**
 * Compose the final prompt for Flux Kontext from a preset (the short
 * style name) and an optional per-request client direction.
 *
 * Returns: { prompt: string }
 * (Negative is folded into the prompt — Flux Kontext has no separate
 * negative_prompt parameter.)
 */
function buildPrompt(preset, customAddition) {
    const styleName = ((preset && preset.promptLayers && preset.promptLayers.style) || '').trim();
    const qualityOverride = ((preset && preset.promptLayers && preset.promptLayers.qualityOverride) || '').trim();
    const negativeOverride = ((preset && preset.promptLayers && preset.promptLayers.negativeOverride) || '').trim();
    const quality = qualityOverride || QUALITY_LAYER;
    const negative = negativeOverride || NEGATIVE_GUIDANCE;
    const userCustom = (customAddition || '').trim();

    const keepBlock = 'STRICT — keep these identical to the input photograph:\n' +
        KEEP_BULLETS.map(b => '  • ' + b).join('\n');

    const changeBlock = 'OK TO CHANGE — re-imagine these in the requested style:\n' +
        CHANGE_BULLETS.map(b => '  • ' + b).join('\n');

    const sections = [
        `TASK: Restyle this interior photograph into a ${styleName} aesthetic.`,
        keepBlock,
        changeBlock,
        userCustom ? `CLIENT DIRECTION: ${userCustom}.` : '',
        `LIGHT & CAMERA: ${quality}`,
        `AVOID: ${negative}`
    ].filter(Boolean);

    return { prompt: sections.join('\n\n') };
}

/**
 * Start Stage 1 — Flux Kontext Max generation.
 *
 * Returns the prediction id; completion is delivered to /api/v1/design/webhook
 * (or polled on-demand from /jobs/:jobId in local dev).
 */
async function startGeneration({ inputImageUrl, preset, customAddition, baseUrl }) {
    const client = getClient();
    const { prompt } = buildPrompt(preset, customAddition);

    const createOpts = {
        model: MODEL_GENERATE,
        input: {
            prompt,
            input_image: inputImageUrl,
            aspect_ratio: 'match_input_image',
            output_format: 'jpg',
            safety_tolerance: 2
        }
    };
    if (baseUrl) {
        createOpts.webhook = `${baseUrl}/api/v1/design/webhook`;
        createOpts.webhook_events_filter = ['completed'];
    }

    const prediction = await client.predictions.create(createOpts);

    return {
        predictionId: prediction.id,
        status: prediction.status,
        prompt
    };
}

/**
 * Start Stage 2 — Clarity upscaler / detail refiner.
 *
 * Takes the Stage 1 output URL, returns a higher-resolution version with
 * sharper materials, textures and edges. Composition is preserved at
 * `resemblance: 0.6` and `creativity: 0.3`.
 */
async function startUpscale({ imageUrl, baseUrl }) {
    const client = getClient();

    const createOpts = {
        model: MODEL_UPSCALE,
        input: {
            image: imageUrl,
            prompt:
                'masterpiece, best quality, highres, ultra-detailed architectural ' +
                'interior, true-to-life premium materials, sharp natural textures, ' +
                'fine wood grain, marble veining, fabric weave',
            negative_prompt:
                'low quality, blurry, cartoon, painting, plastic, oversaturated, ' +
                'jpeg artifacts, banding',
            scale_factor: 2,
            dynamic: 6,
            creativity: 0.3,
            resemblance: 0.6,
            num_inference_steps: 18,
            output_format: 'jpg'
        }
    };
    if (baseUrl) {
        createOpts.webhook = `${baseUrl}/api/v1/design/webhook`;
        createOpts.webhook_events_filter = ['completed'];
    }

    const prediction = await client.predictions.create(createOpts);

    return {
        predictionId: prediction.id,
        status: prediction.status
    };
}

/**
 * Fetch current status of a Replicate prediction. Used as a fallback when
 * webhooks aren't reachable (local dev) or for manual reconciliation.
 */
async function getPredictionStatus(predictionId) {
    return getClient().predictions.get(predictionId);
}

/**
 * Cancel an in-flight prediction. Useful for an admin "cancel" button.
 */
async function cancelPrediction(predictionId) {
    return getClient().predictions.cancel(predictionId);
}

module.exports = {
    buildPrompt,
    startGeneration,
    startUpscale,
    getPredictionStatus,
    cancelPrediction,
    // Exported for tests / debugging
    KEEP_BULLETS,
    CHANGE_BULLETS,
    ARCHITECTURAL_LOCK,
    QUALITY_LAYER,
    NEGATIVE_GUIDANCE,
    MODEL_GENERATE,
    MODEL_UPSCALE,
    // Back-compat aliases for any callers still using the old names
    NEGATIVE_LAYER: NEGATIVE_GUIDANCE
};
