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
// Prompt sandwich for Flux Kontext (instruction-style editor)
//
// Flux Kontext is NOT a text-to-image model — it edits the provided
// `input_image` according to natural-language instructions. It does not
// take a separate negative_prompt; undesired elements are excluded
// inline ("avoid X, Y, Z").
//
// Composition order:
//   1. ARCHITECTURAL_LOCK  — hard contract: keep the room as-is
//   2. preset.style        — the curated style description (middle layer)
//   3. customAddition      — optional per-request client direction
//   4. QUALITY_LAYER       — camera, light, magazine cinematography
//   5. NEGATIVE_GUIDANCE   — inline avoidance phrases
// ─────────────────────────────────────────────────────────────────────

const ARCHITECTURAL_LOCK =
    'Transform the interior of this exact room. Preserve completely the original ' +
    'walls, windows, doors, ceiling shape and floor plan visible in the input ' +
    'photograph — do not add, remove, or relocate any architectural element. ' +
    'Only change the materials, finishes, furniture, lighting fixtures, ' +
    'decoration and color treatment of the space.';

const QUALITY_LAYER =
    'Editorial architectural photography for Architectural Digest, shot on a ' +
    'medium-format Hasselblad H6D with a 35mm lens at f/4, late-afternoon ' +
    'golden-hour daylight pouring through the windows with soft natural ' +
    'diffusion, true-to-life premium materials, ultra-detailed micro-textures, ' +
    'subtle ambient occlusion, calm restrained lived-in luxury, magazine ' +
    'spread composition.';

const NEGATIVE_GUIDANCE =
    'Avoid: cluttered staging, oversaturated colors, fake CGI plastic look, ' +
    'harsh artificial shadows, instagram filter aesthetic, garish neon ' +
    'lighting, cartoonish rendering, watermarks, visible text, distorted ' +
    'perspective, melted geometry, low-resolution textures.';

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
 * Compose the final single-string prompt for Flux Kontext from the
 * preset's middle layer, the user's optional free-text addition, and
 * the global quality + negative-guidance layers.
 *
 * Returns: { prompt: string }
 * (Negative is folded into the prompt — Flux Kontext has no separate
 * negative_prompt parameter.)
 */
function buildPrompt(preset, customAddition) {
    const styleLayer = ((preset && preset.promptLayers && preset.promptLayers.style) || '').trim();
    const qualityOverride = ((preset && preset.promptLayers && preset.promptLayers.qualityOverride) || '').trim();
    const negativeOverride = ((preset && preset.promptLayers && preset.promptLayers.negativeOverride) || '').trim();
    const quality = qualityOverride || QUALITY_LAYER;
    const negative = negativeOverride || NEGATIVE_GUIDANCE;
    const userCustom = (customAddition || '').trim();

    const parts = [
        ARCHITECTURAL_LOCK,
        styleLayer,
        userCustom ? `Additional client direction: ${userCustom}.` : '',
        quality,
        negative
    ].filter(Boolean);

    return { prompt: parts.join(' ') };
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
    ARCHITECTURAL_LOCK,
    QUALITY_LAYER,
    NEGATIVE_GUIDANCE,
    MODEL_GENERATE,
    MODEL_UPSCALE,
    // Back-compat aliases for any callers still using the old names
    NEGATIVE_LAYER: NEGATIVE_GUIDANCE
};
