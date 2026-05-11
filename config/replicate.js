/**
 * Replicate Service
 *
 * Single source of truth for talking to the Replicate API. Encapsulates:
 *  - The "Prompt Sandwich" composition (Quality + Style + Negative).
 *  - Choice of model + ControlNet stack (SDXL + Depth + M-LSD).
 *  - Webhook URL construction.
 *
 * Why a wrapper instead of calling Replicate inline:
 *  1. Phase 3 may swap to Fal.ai for lower latency — only this file changes.
 *  2. Easier to unit-test prompt construction without hitting the API.
 *  3. Centralized cost accounting & rate-limit handling later.
 */

const Replicate = require('replicate');

// ─────────────────────────────────────────────────────────────────────
// Prompt Sandwich — fixed top & bottom layers per the Sprint 1 brief.
// These are global defaults; a preset may override either via
// promptLayers.qualityOverride / negativeOverride if we ever need to.
// ─────────────────────────────────────────────────────────────────────
const QUALITY_LAYER =
    '8k professional architectural photography, natural daylight, ' +
    'soft shadows, sharp focus, shot on Hasselblad H6D, ultra-detailed materials';

const NEGATIVE_LAYER =
    'cluttered, oversaturated, cartoonish, low quality, distorted geometry, ' +
    'warped walls, surreal, watermark, people, text, fish-eye lens, plastic-looking';

// ─────────────────────────────────────────────────────────────────────
// Model selection
//
// `adirik/interior-design` — purpose-built interior redesign model on
// Replicate. Internally uses SDXL with a depth+canny ControlNet ensemble
// tuned to preserve room geometry. Good fit for Phase 1 with minimal
// wiring on our side.
//
// If we later need finer control over Depth/M-LSD weights individually,
// we'll switch to a generic SDXL + ControlNet pipeline (e.g.
// `lucataco/sdxl-controlnet`) and pass our own conditioning images. For
// MVP, `adirik/interior-design` is the simpler, more reliable choice.
// ─────────────────────────────────────────────────────────────────────
const MODEL_VERSION = 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38';

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
 * Compose the final prompt + negative prompt from a preset's middle layer
 * and the user's optional free-text addition.
 *
 * Output:
 *  { prompt: string, negativePrompt: string }
 */
function buildPrompt(preset, customAddition) {
    const styleLayer = (preset.promptLayers && preset.promptLayers.style) || '';
    const quality = (preset.promptLayers && preset.promptLayers.qualityOverride) || QUALITY_LAYER;
    const negative = (preset.promptLayers && preset.promptLayers.negativeOverride) || NEGATIVE_LAYER;

    const userCustom = (customAddition || '').trim();
    const middleLayer = userCustom ? `${styleLayer}, ${userCustom}` : styleLayer;

    const prompt = `${middleLayer}, ${quality}`;

    return {
        prompt,
        negativePrompt: negative
    };
}

/**
 * Start a generation prediction on Replicate.
 *
 * Replicate runs asynchronously — this returns immediately with a
 * prediction ID. Completion is delivered to our `/api/v1/design/webhook`
 * endpoint when Replicate calls us back.
 *
 * Falls back to no-webhook (sync polling) if BASE_URL is unset, which is
 * the case in local dev where Replicate can't reach us.
 */
async function startGeneration({ inputImageUrl, preset, customAddition, baseUrl }) {
    const client = getClient();
    const { prompt, negativePrompt } = buildPrompt(preset, customAddition);

    const cn = preset.controlnet || {};
    const denoise = typeof cn.denoise === 'number' ? cn.denoise : 0.78;

    const input = {
        image: inputImageUrl,
        prompt,
        negative_prompt: negativePrompt,
        // Higher guidance = stronger adherence to prompt (typical 7-15)
        guidance_scale: 12,
        // Steps: 30-40 is the quality/cost sweet spot for SDXL
        num_inference_steps: 35,
        // How much we transform the input (0 = identical, 1 = ignore input).
        // 0.75-0.80 = "visible style change while keeping walls stable".
        prompt_strength: denoise,
        // Random seed for reproducibility; -1 = random each time
        seed: -1
    };

    const createOpts = { version: MODEL_VERSION, input };
    if (baseUrl) {
        createOpts.webhook = `${baseUrl}/api/v1/design/webhook`;
        createOpts.webhook_events_filter = ['completed'];
    }

    const prediction = await client.predictions.create(createOpts);

    return {
        predictionId: prediction.id,
        status: prediction.status,  // usually "starting"
        prompt,
        negativePrompt
    };
}

/**
 * Fetch current status of a Replicate prediction. Used as a fallback when
 * webhooks aren't reachable (local dev) or for manual reconciliation.
 */
async function getPredictionStatus(predictionId) {
    const client = getClient();
    return client.predictions.get(predictionId);
}

/**
 * Cancel an in-flight prediction. Useful for admin "cancel" button.
 */
async function cancelPrediction(predictionId) {
    const client = getClient();
    return client.predictions.cancel(predictionId);
}

module.exports = {
    buildPrompt,
    startGeneration,
    getPredictionStatus,
    cancelPrediction,
    // Exported for tests
    QUALITY_LAYER,
    NEGATIVE_LAYER,
    MODEL_VERSION
};
