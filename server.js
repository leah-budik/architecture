/**
 * LEAH BUDIK ARCHITECTURE
 * Server with Admin Panel - MongoDB + Cloudinary Edition
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Database and Storage
const { connectDB } = require('./config/database');
const { uploaders, deleteImage, deleteImages, createUploader } = require('./config/cloudinary');

// Models
const SiteContent = require('./models/SiteContent');
const Gallery = require('./models/Gallery');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
        req.session.isAuthenticated = true;
        req.session.username = username;
        res.json({ success: true });
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
// SERVE PUBLIC PAGES
// ═══════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gallery/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery.html'));
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
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
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
