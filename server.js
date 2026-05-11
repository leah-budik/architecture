/**
 * LEAH BUDIK ARCHITECTURE
 * Server with Admin Panel - MongoDB + Cloudinary Edition
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Database and Storage
const { connectDB } = require('./config/database');
const { uploaders, deleteImage, deleteImages, createUploader } = require('./config/cloudinary');
const replicateService = require('./config/replicate');

// Models
const SiteContent = require('./models/SiteContent');
const Gallery = require('./models/Gallery');
const DesignJob = require('./models/DesignJob');
const StylePreset = require('./models/StylePreset');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY (helmet) — must be applied early, before routes
// ═══════════════════════════════════════════════════════════════════════════
app.use(helmet({
    // Custom CSP that allows our actual dependencies (Cloudinary, Google Fonts,
    // inline SVG favicons). Without this, helmet's default CSP would block them.
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            // Inline styles are used in some HTML (e.g. gallery.html <style>).
            // Allowing 'unsafe-inline' here is acceptable for a single-author CMS.
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://api.fontshare.com", "data:"],
            // Inline scripts in HTML (small init scripts). Same-origin /public/js/*.js is the main bundle.
            scriptSrc: ["'self'", "'unsafe-inline'"],
            // The admin panel uses lots of inline event handlers (onclick="...").
            // helmet's default sets script-src-attr 'none' which would block them.
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: [
                "'self'", "data:", "blob:",
                "https://res.cloudinary.com", "https://*.cloudinary.com",
                // Replicate serves generated images from these CDN hosts.
                // Without these the AI Studio's result panel renders blank
                // even though the job succeeded.
                "https://replicate.delivery", "https://*.replicate.delivery",
                "https://pbxt.replicate.delivery"
            ],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"], // can't be embedded in <iframe> elsewhere
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    // X-Frame-Options redundant with frameAncestors above; helmet sets DENY by default.
    crossOriginEmbedderPolicy: false, // Cloudinary images don't send COEP headers
    crossOriginResourcePolicy: { policy: 'cross-origin' } // allow Cloudinary loads
}));

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration. SESSION_SECRET MUST be set via env — the server
// refuses to start without it (see startServer). No fallback default.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'lb.sid',
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Rate limiter for login — prevents brute-force password guessing.
// 5 attempts per 15 minutes per IP, then locked out for the rest of the window.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'יותר מדי ניסיונות התחברות. נסי שוב בעוד 15 דקות.' },
    skipSuccessfulRequests: true // don't count valid logins against the limit
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.redirect('/admin/login');
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION ROUTES
// ═══════════════════════════════════════════════════════════════════════════
app.get('/admin/login', (req, res) => {
    if (req.session.isAuthenticated) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {};

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If env vars aren't configured, refuse to authenticate at all rather than
    // falling back to a known default (which would be a backdoor).
    if (!adminUsername || !adminPassword) {
        console.error('LOGIN BLOCKED: ADMIN_USERNAME or ADMIN_PASSWORD missing in env');
        return res.status(500).json({ error: 'שגיאת תצורה בשרת. צרי קשר עם המנהל.' });
    }

    if (username === adminUsername && password === adminPassword) {
        // Regenerate session ID after login to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regenerate failed:', err);
                return res.status(500).json({ error: 'שגיאת התחברות' });
            }
            req.session.isAuthenticated = true;
            req.session.username = username;
            req.session.save(() => res.json({ success: true }));
        });
    } else {
        res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!req.session.isAuthenticated });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL ROUTES
// ═══════════════════════════════════════════════════════════════════════════
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT API ROUTES (MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

// Get all site content
app.get('/api/content', async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        res.json(content.toFrontendJSON());
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// Update site content
app.put('/api/content', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        Object.assign(content, req.body);
        await content.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Update specific section
app.put('/api/content/:section', requireAuth, async (req, res) => {
    try {
        const { section } = req.params;
        const content = await SiteContent.getContent();
        content[section] = req.body;
        await content.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ error: 'Failed to update section' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GALLERIES API ROUTES (MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

// Get all galleries
app.get('/api/galleries', async (req, res) => {
    try {
        const galleries = await Gallery.getAllForFrontend();
        res.json(galleries);
    } catch (error) {
        console.error('Error fetching galleries:', error);
        res.status(500).json({ error: 'Failed to fetch galleries' });
    }
});

// Get single gallery
app.get('/api/galleries/:id', async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ id: req.params.id });
        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }
        res.json(gallery.toFrontendJSON());
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

// Create new gallery
app.post('/api/galleries', requireAuth, async (req, res) => {
    try {
        const galleryId = 'gallery-' + Date.now();
        const folder = req.body.folder || req.body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || galleryId;

        const newGallery = new Gallery({
            id: galleryId,
            ...req.body,
            folder: folder,
            images: [],
            createdAt: new Date()
        });

        await newGallery.save();
        res.json(newGallery.toFrontendJSON());
    } catch (error) {
        console.error('Error creating gallery:', error);
        res.status(500).json({ error: 'Failed to create gallery' });
    }
});

// Update gallery
app.put('/api/galleries/:id', requireAuth, async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ id: req.params.id });
        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        Object.assign(gallery, req.body);
        await gallery.save();
        res.json(gallery.toFrontendJSON());
    } catch (error) {
        console.error('Error updating gallery:', error);
        res.status(500).json({ error: 'Failed to update gallery' });
    }
});

// Delete gallery
app.delete('/api/galleries/:id', requireAuth, async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ id: req.params.id });
        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        // Delete all gallery images from Cloudinary
        const publicIds = gallery.images
            .filter(img => img.publicId)
            .map(img => img.publicId);

        if (gallery.coverImagePublicId) {
            publicIds.push(gallery.coverImagePublicId);
        }

        if (publicIds.length > 0) {
            await deleteImages(publicIds);
        }

        await Gallery.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting gallery:', error);
        res.status(500).json({ error: 'Failed to delete gallery' });
    }
});

// Reorder galleries
app.put('/api/galleries-order', requireAuth, async (req, res) => {
    try {
        const { order } = req.body; // Array of gallery IDs in new order

        for (let i = 0; i < order.length; i++) {
            await Gallery.updateOne({ id: order[i] }, { order: i });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering galleries:', error);
        res.status(500).json({ error: 'Failed to reorder galleries' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// IMAGES API ROUTES (Cloudinary)
// ═══════════════════════════════════════════════════════════════════════════

// Upload images to gallery
app.post('/api/galleries/:id/images', requireAuth, async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ id: req.params.id });
        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        // Create uploader for this gallery's folder
        const folderName = gallery.folder || req.params.id;
        const upload = createUploader(`galleries/${folderName}`);

        // Handle file upload
        upload.array('images', 20)(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ error: err.message });
            }

            const newImages = req.files.map(file => ({
                id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                filename: file.originalname,
                path: file.path, // Cloudinary URL
                publicId: file.filename, // Cloudinary public_id
                originalName: file.originalname,
                size: file.size,
                uploadedAt: new Date()
            }));

            gallery.images.push(...newImages);
            await gallery.save();

            res.json({ success: true, images: newImages.map(img => ({
                id: img.id,
                filename: img.filename,
                path: img.path,
                originalName: img.originalName,
                size: img.size,
                uploadedAt: img.uploadedAt
            }))});
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// Delete image from gallery
app.delete('/api/galleries/:galleryId/images/:imageId', requireAuth, async (req, res) => {
    try {
        const gallery = await Gallery.findOne({ id: req.params.galleryId });
        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const image = gallery.images.find(img => img.id === req.params.imageId);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete from Cloudinary
        if (image.publicId) {
            await deleteImage(image.publicId);
        }

        // Remove from gallery
        gallery.images = gallery.images.filter(img => img.id !== req.params.imageId);
        await gallery.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Reorder images in gallery
app.put('/api/galleries/:id/images-order', requireAuth, async (req, res) => {
    try {
        const { order } = req.body; // Array of image IDs in new order
        const gallery = await Gallery.findOne({ id: req.params.id });

        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const reordered = order
            .map(id => gallery.images.find(img => img.id === id))
            .filter(Boolean);

        gallery.images = reordered;
        await gallery.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering images:', error);
        res.status(500).json({ error: 'Failed to reorder images' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIALS API ROUTES (MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

// Get all testimonials
app.get('/api/testimonials', async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        res.json(content.testimonials || []);
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

// Add testimonial
app.post('/api/testimonials', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();

        const newTestimonial = {
            id: 'testimonial-' + Date.now(),
            ...req.body,
            createdAt: new Date()
        };

        content.testimonials.push(newTestimonial);
        await content.save();
        res.json(newTestimonial);
    } catch (error) {
        console.error('Error adding testimonial:', error);
        res.status(500).json({ error: 'Failed to add testimonial' });
    }
});

// Update testimonial
app.put('/api/testimonials/:id', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        const index = content.testimonials.findIndex(t => t.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        content.testimonials[index] = { ...content.testimonials[index], ...req.body };
        await content.save();
        res.json(content.testimonials[index]);
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

// Delete testimonial
app.delete('/api/testimonials/:id', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        const index = content.testimonials.findIndex(t => t.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }

        content.testimonials.splice(index, 1);
        await content.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// HERO IMAGES API ROUTES (Cloudinary)
// ═══════════════════════════════════════════════════════════════════════════

// Upload hero image
app.post('/api/hero-images', requireAuth, (req, res) => {
    uploaders.hero.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Hero upload error:', err);
            return res.status(400).json({ error: err.message });
        }

        try {
            const content = await SiteContent.getContent();

            const newImage = {
                id: 'hero-' + Date.now(),
                filename: req.file.originalname,
                path: req.file.path, // Cloudinary URL
                publicId: req.file.filename, // Cloudinary public_id
                uploadedAt: new Date()
            };

            if (!content.hero) {
                content.hero = { images: [] };
            }
            if (!content.hero.images) {
                content.hero.images = [];
            }

            content.hero.images.push(newImage);
            await content.save();

            res.json({
                id: newImage.id,
                path: newImage.path,
                uploadedAt: newImage.uploadedAt
            });
        } catch (error) {
            console.error('Error saving hero image:', error);
            res.status(500).json({ error: 'Failed to save hero image' });
        }
    });
});

// Delete hero image
app.delete('/api/hero-images/:id', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        const index = content.hero?.images?.findIndex(img => img.id === req.params.id);

        if (index === -1 || index === undefined) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const image = content.hero.images[index];

        // Delete from Cloudinary
        if (image.publicId) {
            await deleteImage(image.publicId);
        }

        content.hero.images.splice(index, 1);
        await content.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting hero image:', error);
        res.status(500).json({ error: 'Failed to delete hero image' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGO API ROUTES (Cloudinary)
// ═══════════════════════════════════════════════════════════════════════════

// Upload logo
app.post('/api/logo', requireAuth, (req, res) => {
    uploaders.logo.single('logo')(req, res, async (err) => {
        if (err) {
            console.error('Logo upload error:', err);
            return res.status(400).json({ error: err.message });
        }

        try {
            const content = await SiteContent.getContent();
            const logoType = req.body.type || 'main'; // main, light, or favicon

            if (!content.logo) {
                content.logo = {};
            }

            // Delete old logo from Cloudinary if exists
            const oldPublicIdField = `${logoType}PublicId`;
            if (content.logo[oldPublicIdField]) {
                await deleteImage(content.logo[oldPublicIdField]);
            }

            // Save new logo
            content.logo[logoType] = req.file.path; // Cloudinary URL
            content.logo[oldPublicIdField] = req.file.filename; // Cloudinary public_id

            await content.save();

            res.json({ success: true, path: req.file.path });
        } catch (error) {
            console.error('Error saving logo:', error);
            res.status(500).json({ error: 'Failed to save logo' });
        }
    });
});

// Delete logo
app.delete('/api/logo/:type', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        const logoType = req.params.type;

        if (!content.logo || !content.logo[logoType]) {
            return res.status(404).json({ error: 'Logo not found' });
        }

        // Delete from Cloudinary
        const publicIdField = `${logoType}PublicId`;
        if (content.logo[publicIdField]) {
            await deleteImage(content.logo[publicIdField]);
        }

        // Remove from database
        content.logo[logoType] = undefined;
        content.logo[publicIdField] = undefined;
        await content.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting logo:', error);
        res.status(500).json({ error: 'Failed to delete logo' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI DESIGN STUDIO — Sprint 1 MVP (admin-only for now)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Public base URL for webhook callbacks. Required in production so Replicate
 * can call us back when a prediction completes. In local dev where Replicate
 * can't reach us, we fall back to client-side polling of /jobs/:jobId.
 */
function getPublicBaseUrl(req) {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
    if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
    // Only trust the Host header in production behind our trusted proxy
    if (process.env.NODE_ENV === 'production' && req) {
        return `${req.protocol}://${req.get('host')}`;
    }
    return null; // local dev: no webhook, frontend will poll Replicate via us
}

// POST /api/v1/design/upload — accept a single room photo from the admin,
// stash it in Cloudinary under leah-budik/design-inputs/, and return the URL
// the client will then pass to /generate.
//
// Kept as a separate endpoint (rather than uploading inside /generate) so
// that the admin can preview the image before committing to a paid Replicate
// run, and so the upload progress doesn't block the generate call.
app.post('/api/v1/design/upload', requireAuth, (req, res) => {
    uploaders.designInput.single('image')(req, res, (err) => {
        if (err) {
            console.error('AI design upload error:', err);
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'לא התקבל קובץ. בדקי גודל (מקס 10MB) ופורמט (JPG/PNG/WEBP).' });
        }
        res.json({
            url: req.file.path,           // Cloudinary URL
            publicId: req.file.filename,  // for cleanup later
            size: req.file.size,
            originalName: req.file.originalname
        });
    });
});

// GET /api/v1/design/presets — list the 5 styles for the picker
app.get('/api/v1/design/presets', requireAuth, async (req, res) => {
    try {
        const presets = await StylePreset.find({ tenantSlug: 'leahbudik', isActive: true })
            .sort({ order: 1 });
        res.json(presets.map(p => p.toClientJSON()));
    } catch (error) {
        console.error('Error listing presets:', error);
        res.status(500).json({ error: 'Failed to list presets' });
    }
});

// POST /api/v1/design/generate — kick off a new generation
app.post('/api/v1/design/generate', requireAuth, async (req, res) => {
    try {
        const { imageUrl, presetId, customAddition, referenceLine } = req.body || {};

        if (!imageUrl || typeof imageUrl !== 'string') {
            return res.status(400).json({ error: 'imageUrl is required' });
        }
        if (!presetId || typeof presetId !== 'string') {
            return res.status(400).json({ error: 'presetId is required' });
        }

        // Look up the preset (validates the choice + gives us the prompt/CN settings)
        const preset = await StylePreset.findOne({
            tenantSlug: 'leahbudik',
            slug: presetId,
            isActive: true
        });
        if (!preset) {
            return res.status(404).json({ error: `Preset '${presetId}' not found` });
        }

        // Create the job record FIRST so we have a paper trail even if Replicate errors
        const jobId = DesignJob.newJobId();
        const job = await DesignJob.create({
            jobId,
            tenantSlug: 'leahbudik',
            inputImageUrl: imageUrl,
            presetSlug: presetId,
            customAddition: customAddition || '',
            referenceLine: referenceLine || null,
            stage: 'generating',
            status: 'queued'
        });

        // Fire Stage 1 (Flux Kontext Max). If this throws, the job stays in
        // 'queued' and the admin can retry / debug from the history view.
        // Stage 2 (upscale) is kicked off automatically from applyPredictionResult
        // once Stage 1 succeeds.
        try {
            const baseUrl = getPublicBaseUrl(req);
            const result = await replicateService.startGeneration({
                inputImageUrl: imageUrl,
                preset,
                customAddition,
                baseUrl
            });

            job.predictionId = result.predictionId;
            job.promptUsed = result.prompt;
            job.stage = 'generating';
            job.status = 'running';
            job.startedAt = new Date();
            await job.save();
        } catch (replicateErr) {
            console.error('Replicate startGeneration failed:', replicateErr);
            job.status = 'failed';
            job.error = replicateErr.message || 'Replicate API error';
            job.completedAt = new Date();
            await job.save();
            return res.status(502).json({
                jobId: job.jobId,
                error: 'Failed to start generation: ' + (replicateErr.message || 'unknown')
            });
        }

        res.json({
            jobId: job.jobId,
            status: job.status,
            // Two-stage pipeline: ~15-25s generate + ~15-25s upscale
            estimatedSeconds: 45
        });
    } catch (error) {
        console.error('Error in /generate:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /api/v1/design/jobs/:jobId — poll job status
app.get('/api/v1/design/jobs/:jobId', requireAuth, async (req, res) => {
    try {
        const job = await DesignJob.findOne({ jobId: req.params.jobId });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // If we're still 'running' but the webhook may not have reached us
        // (local dev, or webhook dropped), do an on-demand status check.
        // The active prediction id depends on which pipeline stage we're in:
        //   stage='generating' → check predictionId (Stage 1, Flux Kontext)
        //   stage='upscaling'  → check upscalePredictionId (Stage 2, Clarity)
        if (job.status === 'running') {
            const activePredictionId = job.stage === 'upscaling'
                ? job.upscalePredictionId
                : job.predictionId;
            const stale = !job.completedAt && job.startedAt &&
                (Date.now() - job.startedAt.getTime()) > 8000;
            if (activePredictionId && stale) {
                try {
                    const pred = await replicateService.getPredictionStatus(activePredictionId);
                    await applyPredictionResult(job, pred);
                } catch (e) {
                    // Non-fatal: we'll try again on next poll
                    console.warn('Background status check failed:', e.message);
                }
            }
        }

        res.json(job.toClientJSON());
    } catch (error) {
        console.error('Error in /jobs/:jobId:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// GET /api/v1/design/jobs — admin history list, newest first, paginated
app.get('/api/v1/design/jobs', requireAuth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const before = req.query.before ? new Date(req.query.before) : null;
        const q = { tenantSlug: 'leahbudik' };
        if (before && !isNaN(before)) q.createdAt = { $lt: before };

        const items = await DesignJob.find(q).sort({ createdAt: -1 }).limit(limit);
        const nextCursor = items.length === limit ? items[items.length - 1].createdAt : null;
        res.json({
            items: items.map(j => j.toClientJSON()),
            nextCursor
        });
    } catch (error) {
        console.error('Error listing jobs:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

/**
 * POST /api/v1/design/webhook — Replicate calls us here when a prediction
 * completes. NOT auth-protected (Replicate doesn't carry our session), but
 * we identify the job via the predictionId in the body. Signature
 * verification will be added before public launch.
 */
app.post('/api/v1/design/webhook', async (req, res) => {
    try {
        const pred = req.body || {};
        if (!pred.id) return res.status(400).json({ error: 'missing prediction id' });

        // Webhook may fire for either Stage 1 (Flux Kontext) or Stage 2
        // (Clarity upscaler). Match against both id fields.
        const job = await DesignJob.findOne({
            $or: [{ predictionId: pred.id }, { upscalePredictionId: pred.id }]
        });
        if (!job) {
            console.warn('Webhook for unknown predictionId:', pred.id);
            return res.status(200).json({ ok: true });  // ack so Replicate stops retrying
        }

        await applyPredictionResult(job, pred);
        res.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

/**
 * Translate a Replicate prediction object into our job record. Called from
 * both the webhook and the on-demand status poll.
 *
 * Handles the two-stage pipeline:
 *   Stage 1 succeeds → save intermediate, kick off Stage 2.
 *   Stage 2 succeeds → save final result, mark job done.
 *   Stage 1 fails    → mark whole job failed.
 *   Stage 2 fails    → fall back to Stage 1 result (still magazine-grade);
 *                      job is marked done so the user gets something useful.
 */
async function applyPredictionResult(job, pred) {
    if (!pred || !pred.status) return;

    // Determine which stage this prediction belongs to. We compare against
    // both ids because a single job has two prediction ids over its lifetime.
    const isStage2 = job.upscalePredictionId && pred.id === job.upscalePredictionId;
    const isStage1 = !isStage2 && job.predictionId && pred.id === job.predictionId;

    if (pred.status === 'succeeded') {
        // Replicate output may be a URL string or an array of URLs.
        const output = Array.isArray(pred.output) ? pred.output[0] : pred.output;
        if (!output || typeof output !== 'string') {
            job.status = 'failed';
            job.error = 'No output URL in successful prediction';
            job.completedAt = new Date();
            await job.save();
            return;
        }

        if (isStage1) {
            // Stage 1 done. Save intermediate, kick off Stage 2 (upscale).
            job.intermediateImageUrl = output;
            job.stage = 'upscaling';
            job.costUsd = (job.costUsd || 0) + 0.08;
            await job.save();

            try {
                // baseUrl from env (PUBLIC_BASE_URL / RENDER_EXTERNAL_URL).
                // No req here — we're inside the webhook handler or a poll.
                const baseUrl = getPublicBaseUrl(null);
                const upscale = await replicateService.startUpscale({
                    imageUrl: output,
                    baseUrl
                });
                job.upscalePredictionId = upscale.predictionId;
                await job.save();
            } catch (e) {
                // Upscale failed to START. Don't fail the job — the Flux
                // Kontext output is already premium. Surface it as the
                // final result.
                console.warn('Upscale start failed, using Stage 1 output as final:', e.message);
                job.resultImageUrl = output;
                job.stage = 'done';
                job.status = 'done';
                job.completedAt = new Date();
                await job.save();
            }
            return;
        }

        if (isStage2) {
            // Stage 2 done. This is the final, upscaled result.
            job.resultImageUrl = output;
            job.stage = 'done';
            job.status = 'done';
            job.completedAt = new Date();
            job.costUsd = (job.costUsd || 0) + 0.012;
            await job.save();
            return;
        }

        // Shouldn't happen — prediction id matched neither stage.
        console.warn('applyPredictionResult: prediction id matched no known stage for job', job.jobId);
        return;
    }

    if (pred.status === 'failed' || pred.status === 'canceled') {
        if (isStage2 && job.intermediateImageUrl) {
            // Upscale failed but we have a good Stage 1 render. Ship it.
            console.warn('Upscale failed, falling back to Stage 1 result:', pred.error);
            job.resultImageUrl = job.intermediateImageUrl;
            job.stage = 'done';
            job.status = 'done';
            job.error = '';
            job.completedAt = new Date();
            await job.save();
            return;
        }
        // Stage 1 failed, or no fallback available. Whole job fails.
        job.status = 'failed';
        job.error = pred.error || `Prediction ${pred.status}`;
        job.completedAt = new Date();
        await job.save();
        return;
    }
    // 'starting' | 'processing' — leave as 'running'
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVE PUBLIC PAGES
// ═══════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gallery/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery.html'));
});

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT IMAGE API ROUTES (Cloudinary)
// ═══════════════════════════════════════════════════════════════════════════

// Upload about image (portrait)
app.post('/api/about-image', requireAuth, (req, res) => {
    uploaders.about.single('image')(req, res, async (err) => {
        if (err) {
            // Log every property we can get our hands on
            console.error('About upload error - full dump:', {
                message: err.message,
                name: err.name,
                code: err.code,
                http_code: err.http_code,
                stack: err.stack,
                stringified: JSON.stringify(err, Object.getOwnPropertyNames(err))
            });
            return res.status(400).json({
                error: err.message || 'Upload failed',
                details: err.code || err.name || 'unknown',
                httpCode: err.http_code,
                hint: err.message && err.message.includes('Invalid image')
                    ? 'הפורמט של הקובץ לא נתמך. נסי JPG או PNG.'
                    : 'נסי קובץ JPG/PNG אחר. אם זה אייפון, ודאי שלא בפורמט HEIC.'
            });
        }

        if (!req.file) {
            console.error('About upload: no file received');
            return res.status(400).json({ error: 'לא התקבל קובץ. ייתכן שהקובץ גדול מדי (מעל 10MB) או בפורמט לא נתמך.' });
        }

        try {
            const content = await SiteContent.getContent();
            if (!content.about) content.about = {};

            // Delete old about image from Cloudinary if exists
            if (content.about.imagePublicId) {
                await deleteImage(content.about.imagePublicId);
            }

            content.about.image = req.file.path;          // Cloudinary URL
            content.about.imagePublicId = req.file.filename; // Cloudinary public_id

            await content.save();
            res.json({ success: true, path: req.file.path });
        } catch (error) {
            console.error('Error saving about image:', error);
            res.status(500).json({ error: 'Failed to save about image: ' + error.message });
        }
    });
});

// Delete about image
app.delete('/api/about-image', requireAuth, async (req, res) => {
    try {
        const content = await SiteContent.getContent();
        if (!content.about || !content.about.image) {
            return res.status(404).json({ error: 'About image not found' });
        }

        if (content.about.imagePublicId) {
            await deleteImage(content.about.imagePublicId);
        }

        content.about.image = '';
        content.about.imagePublicId = undefined;
        await content.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting about image:', error);
        res.status(500).json({ error: 'Failed to delete about image' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    const { isDBConnected } = require('./config/database');
    res.json({
        status: 'ok',
        database: isDBConnected() ? 'connected' : 'disconnected'
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════
function connectWithBackgroundRetry() {
    connectDB()
        .then(async () => {
            // Once Mongo is up, seed any missing style presets. Idempotent — safe
            // to run on every successful (re)connection. Failures here aren't
            // fatal; admin can manage presets manually if needed.
            try {
                await StylePreset.seedIfMissing();
            } catch (e) {
                console.warn('StylePreset seeder failed (non-fatal):', e.message);
            }
        })
        .catch((error) => {
            console.error('Initial MongoDB connection failed, will keep retrying in background:', error.message);
            const retryDelayMs = 30000;
            setTimeout(connectWithBackgroundRetry, retryDelayMs);
        });
}

function startServer() {
    // Refuse to start with an insecure or missing SESSION_SECRET — a known/empty
    // secret would let anyone forge an admin session.
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 16 || secret === 'default-secret-change-me') {
        console.error('FATAL: SESSION_SECRET is missing or too short (need 16+ chars).');
        console.error('Set SESSION_SECRET in your environment before starting the server.');
        process.exit(1);
    }
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.warn('WARNING: ADMIN_USERNAME / ADMIN_PASSWORD not set — admin login is disabled.');
    }

    // Start Express immediately so static pages and the health check stay
    // available even if MongoDB is slow or temporarily unreachable.
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏛️  LEAH BUDIK ARCHITECTURE                                 ║
║   Server running on http://localhost:${PORT}                    ║
║                                                               ║
║   📄 Public site:  http://localhost:${PORT}                     ║
║   🔐 Admin panel:  http://localhost:${PORT}/admin               ║
║                                                               ║
║   📦 Database: MongoDB Atlas                                  ║
║   🖼️  Images: Cloudinary                                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
            `);
    });

    connectWithBackgroundRetry();
}

startServer();
