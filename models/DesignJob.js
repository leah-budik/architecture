/**
 * DesignJob Model
 * Tracks each AI image-generation request through the pipeline:
 * queued → running → done | failed
 *
 * One job = one Replicate prediction = one resulting image (or failure).
 * Persisting jobs lets us:
 *  - Poll status from the frontend
 *  - Show generation history
 *  - Reconcile webhook callbacks back to the originating request
 *  - Track costs and capture leads attached to a specific generation
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const ReferenceLineSchema = new mongoose.Schema({
    startX: Number,
    startY: Number,
    endX: Number,
    endY: Number,
    realMeters: Number,
    objectLabel: String  // e.g. "דלת רגילה"
}, { _id: false });

const LeadSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    capturedAt: Date,
    notes: String
}, { _id: false });

const DesignJobSchema = new mongoose.Schema({
    // Public-facing identifier (what the frontend polls with)
    jobId: { type: String, required: true, unique: true, index: true },

    // Multi-tenant readiness - hardcoded for now, swap to ref('Tenant') in Phase 3
    tenantSlug: { type: String, default: 'leahbudik', index: true },

    // What the user submitted
    inputImageUrl: { type: String, required: true },
    inputImagePublicId: { type: String },  // Cloudinary publicId for cleanup
    presetSlug: { type: String, required: true, index: true },
    customAddition: { type: String, default: '' },
    referenceLine: { type: ReferenceLineSchema, default: null },

    // Replicate tracking
    predictionId: { type: String, index: true },  // Replicate's internal ID
    promptUsed: { type: String },  // for debugging / showing the user what we built

    // State machine
    status: {
        type: String,
        enum: ['queued', 'running', 'done', 'failed', 'cancelled'],
        default: 'queued',
        index: true
    },
    progress: { type: Number, default: 0 },  // 0-100, optional rough estimate
    error: { type: String, default: '' },

    // Result
    resultImageUrl: { type: String, default: '' },
    resultImagePublicId: { type: String },

    // Cost tracking (we estimate from Replicate's billing API or pricing)
    costUsd: { type: Number, default: 0 },

    // Lead capture - filled when the user submits contact info after seeing the result
    lead: { type: LeadSchema, default: null },

    // Audit
    createdAt: { type: Date, default: Date.now, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date }
}, {
    timestamps: true,
    collection: 'designjobs'
});

DesignJobSchema.index({ tenantSlug: 1, createdAt: -1 });
DesignJobSchema.index({ status: 1, createdAt: -1 });

/**
 * Generate a URL-safe public job id like "job_a1b2c3d4e5f6".
 * Short enough to fit in a URL, random enough to be unguessable.
 */
DesignJobSchema.statics.newJobId = function () {
    return 'job_' + crypto.randomBytes(8).toString('hex');
};

/**
 * Strip internal fields before sending to the frontend.
 */
DesignJobSchema.methods.toClientJSON = function () {
    return {
        jobId: this.jobId,
        status: this.status,
        progress: this.progress,
        presetSlug: this.presetSlug,
        inputImageUrl: this.inputImageUrl,
        resultImageUrl: this.resultImageUrl,
        customAddition: this.customAddition,
        referenceLine: this.referenceLine,
        error: this.error,
        createdAt: this.createdAt,
        completedAt: this.completedAt,
        leadCaptured: !!(this.lead && this.lead.email)
    };
};

module.exports = mongoose.model('DesignJob', DesignJobSchema);
