/**
 * Migration Script: Local JSON/Files → MongoDB + Cloudinary
 *
 * This script migrates existing data from:
 * - data/content.json → MongoDB SiteContent collection
 * - data/galleries.json → MongoDB Gallery collection
 * - public/images/* → Cloudinary
 *
 * Usage: node scripts/migrate-to-cloud.js
 *
 * IMPORTANT: Make sure .env is configured with:
 * - MONGODB_URI
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Models
const SiteContent = require('../models/SiteContent');
const Gallery = require('../models/Gallery');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const IMAGES_DIR = path.join(ROOT_DIR, 'public', 'images');

// Track upload results
const results = {
    logo: { uploaded: 0, failed: 0, errors: [] },
    hero: { uploaded: 0, failed: 0, errors: [] },
    about: { uploaded: 0, failed: 0, errors: [] },
    galleries: { migrated: 0, failed: 0, errors: [] },
    galleryImages: { uploaded: 0, failed: 0, errors: [] },
    content: { success: false, error: null }
};

// Cache for uploaded images to avoid duplicates
const uploadedImagesCache = new Map();

/**
 * Upload a local image to Cloudinary
 * @param {string} localPath - Local file path (relative like "public/images/...")
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<{url: string, publicId: string}|null>}
 */
async function uploadImageToCloudinary(localPath, folder) {
    // Build full path
    const fullPath = path.join(ROOT_DIR, localPath);

    // Check cache first
    const cacheKey = fullPath;
    if (uploadedImagesCache.has(cacheKey)) {
        console.log(`    ⏩ Using cached: ${path.basename(localPath)}`);
        return uploadedImagesCache.get(cacheKey);
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
        console.log(`    ⚠️  File not found: ${localPath}`);
        return null;
    }

    try {
        // Generate a unique public_id based on original filename
        const originalName = path.basename(localPath, path.extname(localPath));
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
        const publicId = `${originalName}-${uniqueSuffix}`.replace(/[^a-zA-Z0-9-_]/g, '_');

        const result = await cloudinary.uploader.upload(fullPath, {
            folder: `leah-budik/${folder}`,
            public_id: publicId,
            resource_type: 'image',
            overwrite: false,
            transformation: [{ quality: 'auto:good', fetch_format: 'auto' }]
        });

        const uploadResult = {
            url: result.secure_url,
            publicId: result.public_id
        };

        // Cache the result
        uploadedImagesCache.set(cacheKey, uploadResult);

        console.log(`    ✓ Uploaded: ${path.basename(localPath)}`);
        return uploadResult;

    } catch (error) {
        console.error(`    ✗ Failed to upload ${localPath}: ${error.message}`);
        return null;
    }
}

/**
 * Migrate logo images
 */
async function migrateLogo(logoData) {
    console.log('\n  📷 Migrating logo images...');

    const newLogo = {};

    if (logoData.main) {
        const result = await uploadImageToCloudinary(logoData.main, 'logo');
        if (result) {
            newLogo.main = result.url;
            newLogo.mainPublicId = result.publicId;
            results.logo.uploaded++;
        } else {
            results.logo.failed++;
            results.logo.errors.push(logoData.main);
        }
    }

    if (logoData.light) {
        const result = await uploadImageToCloudinary(logoData.light, 'logo');
        if (result) {
            newLogo.light = result.url;
            newLogo.lightPublicId = result.publicId;
            results.logo.uploaded++;
        } else {
            results.logo.failed++;
            results.logo.errors.push(logoData.light);
        }
    }

    if (logoData.favicon) {
        const result = await uploadImageToCloudinary(logoData.favicon, 'logo');
        if (result) {
            newLogo.favicon = result.url;
            newLogo.faviconPublicId = result.publicId;
            results.logo.uploaded++;
        } else {
            results.logo.failed++;
            results.logo.errors.push(logoData.favicon);
        }
    }

    return newLogo;
}

/**
 * Migrate hero images (preserving order and IDs)
 */
async function migrateHeroImages(heroImages) {
    console.log('\n  🖼️  Migrating hero images...');

    const newImages = [];

    for (let i = 0; i < heroImages.length; i++) {
        const img = heroImages[i];
        console.log(`    [${i + 1}/${heroImages.length}] Processing ${img.id}...`);

        const result = await uploadImageToCloudinary(img.path, 'hero');
        if (result) {
            newImages.push({
                id: img.id, // Preserve original ID
                path: result.url,
                publicId: result.publicId,
                uploadedAt: new Date()
            });
            results.hero.uploaded++;
        } else {
            results.hero.failed++;
            results.hero.errors.push({ id: img.id, path: img.path });
        }
    }

    return newImages;
}

/**
 * Migrate about section image
 */
async function migrateAboutImage(imagePath) {
    console.log('\n  📸 Migrating about image...');

    if (!imagePath) {
        console.log('    ⚠️  No about image to migrate');
        return { image: '', imagePublicId: '' };
    }

    const result = await uploadImageToCloudinary(imagePath, 'about');
    if (result) {
        results.about.uploaded++;
        return {
            image: result.url,
            imagePublicId: result.publicId
        };
    } else {
        results.about.failed++;
        results.about.errors.push(imagePath);
        return { image: '', imagePublicId: '' };
    }
}

/**
 * Migrate content.json to MongoDB
 */
async function migrateContent() {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  📄 MIGRATING CONTENT.JSON');
    console.log('═══════════════════════════════════════════════════════════════');

    const contentPath = path.join(DATA_DIR, 'content.json');
    if (!fs.existsSync(contentPath)) {
        console.log('  ⚠️  content.json not found, creating empty content');
        await SiteContent.deleteMany({});
        await SiteContent.create({});
        results.content.success = true;
        return;
    }

    const jsonContent = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

    // Migrate logo
    let newLogo = {};
    if (jsonContent.logo) {
        newLogo = await migrateLogo(jsonContent.logo);
    }

    // Migrate hero images
    let newHeroImages = [];
    if (jsonContent.hero && jsonContent.hero.images && jsonContent.hero.images.length > 0) {
        newHeroImages = await migrateHeroImages(jsonContent.hero.images);
    }

    // Migrate about image
    let aboutImageData = { image: '', imagePublicId: '' };
    if (jsonContent.about && jsonContent.about.image) {
        aboutImageData = await migrateAboutImage(jsonContent.about.image);
    }

    // Build the full content object
    const contentToSave = {
        logo: newLogo,
        hero: {
            subtitle: jsonContent.hero?.subtitle || '',
            title: jsonContent.hero?.title || [],
            description: jsonContent.hero?.description || '',
            ctaText: jsonContent.hero?.ctaText || '',
            images: newHeroImages
        },
        about: {
            label: jsonContent.about?.label || '',
            title: jsonContent.about?.title || '',
            lead: jsonContent.about?.lead || '',
            text: jsonContent.about?.text || '',
            moreText: jsonContent.about?.moreText || '',
            image: aboutImageData.image,
            imagePublicId: aboutImageData.imagePublicId,
            stats: jsonContent.about?.stats || []
        },
        quotes: jsonContent.quotes || [],
        projects: jsonContent.projects || { label: '', title: '', featured: [] },
        testimonials: jsonContent.testimonials || [],
        contact: jsonContent.contact || {},
        footer: jsonContent.footer || {},
        seo: jsonContent.seo || {}
    };

    // Save to MongoDB
    try {
        console.log('\n  💾 Saving content to MongoDB...');
        await SiteContent.deleteMany({});
        await SiteContent.create(contentToSave);
        console.log('  ✓ Content saved successfully!');
        results.content.success = true;
    } catch (error) {
        console.error('  ✗ Failed to save content:', error.message);
        results.content.error = error.message;
    }
}

/**
 * Migrate a single gallery (preserving order and IDs)
 */
async function migrateGallery(gallery, index, total) {
    console.log(`\n  ┌─────────────────────────────────────────────────────────────`);
    console.log(`  │ Gallery ${index + 1}/${total}: ${gallery.name} (${gallery.id})`);
    console.log(`  │ Images: ${gallery.images?.length || 0}`);
    console.log(`  └─────────────────────────────────────────────────────────────`);

    const cloudinaryFolder = `galleries/${gallery.id}`;
    const newImages = [];

    // Migrate gallery images (preserving order)
    if (gallery.images && gallery.images.length > 0) {
        console.log(`    Uploading ${gallery.images.length} images...`);

        for (let i = 0; i < gallery.images.length; i++) {
            const img = gallery.images[i];
            process.stdout.write(`    [${i + 1}/${gallery.images.length}] `);

            const result = await uploadImageToCloudinary(img.path, cloudinaryFolder);
            if (result) {
                newImages.push({
                    id: img.id, // Preserve original ID
                    filename: img.filename,
                    path: result.url,
                    publicId: result.publicId,
                    originalName: img.filename,
                    uploadedAt: new Date()
                });
                results.galleryImages.uploaded++;
            } else {
                results.galleryImages.failed++;
                results.galleryImages.errors.push({ gallery: gallery.id, image: img.id, path: img.path });
            }
        }
    }

    // Find the cover image in the new images array
    let coverImageUrl = null;
    let coverImagePublicId = null;

    if (gallery.coverImage) {
        // Look for the cover image in our uploaded images
        const coverMatch = newImages.find(img => {
            // Match by comparing original path endings
            const originalCoverPath = gallery.coverImage.replace(/\\/g, '/');
            const matchedOriginal = gallery.images?.find(i => i.id === img.id);
            if (matchedOriginal) {
                const matchedPath = matchedOriginal.path.replace(/\\/g, '/');
                return originalCoverPath === matchedPath;
            }
            return false;
        });

        if (coverMatch) {
            coverImageUrl = coverMatch.path;
            coverImagePublicId = coverMatch.publicId;
            console.log(`    ✓ Cover image matched: ${coverMatch.id}`);
        } else if (newImages.length > 0) {
            // Fallback to first image
            coverImageUrl = newImages[0].path;
            coverImagePublicId = newImages[0].publicId;
            console.log(`    ⚠️  Cover image not found, using first image`);
        }
    } else if (newImages.length > 0) {
        // No cover image specified, use first
        coverImageUrl = newImages[0].path;
        coverImagePublicId = newImages[0].publicId;
    }

    // Create gallery document
    const galleryDoc = {
        id: gallery.id,
        name: gallery.name,
        category: gallery.category || '',
        description: gallery.description || '',
        folder: gallery.folder,
        isActive: gallery.isActive !== false,
        isFeatured: gallery.isFeatured || false,
        order: gallery.order || index,
        coverImage: coverImageUrl,
        coverImagePublicId: coverImagePublicId,
        images: newImages,
        createdAt: gallery.createdAt || new Date()
    };

    return galleryDoc;
}

/**
 * Migrate galleries.json to MongoDB
 */
async function migrateGalleries() {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🖼️  MIGRATING GALLERIES.JSON');
    console.log('═══════════════════════════════════════════════════════════════');

    const galleriesPath = path.join(DATA_DIR, 'galleries.json');
    if (!fs.existsSync(galleriesPath)) {
        console.log('  ⚠️  galleries.json not found, skipping');
        return;
    }

    const galleries = JSON.parse(fs.readFileSync(galleriesPath, 'utf8'));

    if (!galleries || galleries.length === 0) {
        console.log('  ⚠️  No galleries found in JSON file');
        return;
    }

    console.log(`  Found ${galleries.length} galleries to migrate`);

    // Delete existing galleries
    await Gallery.deleteMany({});
    console.log('  🗑️  Cleared existing galleries from MongoDB');

    // Sort galleries by order to preserve ordering
    const sortedGalleries = [...galleries].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Migrate each gallery
    for (let i = 0; i < sortedGalleries.length; i++) {
        const gallery = sortedGalleries[i];

        try {
            const galleryDoc = await migrateGallery(gallery, i, sortedGalleries.length);
            await Gallery.create(galleryDoc);
            console.log(`    ✓ Gallery "${gallery.name}" saved (${galleryDoc.images.length} images)`);
            results.galleries.migrated++;
        } catch (error) {
            console.error(`    ✗ Failed to migrate gallery "${gallery.name}": ${error.message}`);
            results.galleries.failed++;
            results.galleries.errors.push({ gallery: gallery.id, error: error.message });
        }
    }
}

/**
 * Print migration summary
 */
function printSummary() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    MIGRATION SUMMARY                          ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');

    // Content status
    console.log('║                                                               ║');
    console.log('║  📄 CONTENT:                                                  ║');
    console.log(`║     Status: ${results.content.success ? '✓ Success' : '✗ Failed'}                                       ║`);
    if (results.content.error) {
        console.log(`║     Error: ${results.content.error.substring(0, 45)}...║`);
    }

    // Logo images
    console.log('║                                                               ║');
    console.log('║  🎨 LOGO IMAGES:                                              ║');
    console.log(`║     Uploaded: ${results.logo.uploaded}                                              ║`);
    console.log(`║     Failed: ${results.logo.failed}                                                ║`);

    // Hero images
    console.log('║                                                               ║');
    console.log('║  🖼️  HERO IMAGES:                                              ║');
    console.log(`║     Uploaded: ${results.hero.uploaded}                                              ║`);
    console.log(`║     Failed: ${results.hero.failed}                                                ║`);

    // About image
    console.log('║                                                               ║');
    console.log('║  📸 ABOUT IMAGE:                                              ║');
    console.log(`║     Uploaded: ${results.about.uploaded}                                              ║`);
    console.log(`║     Failed: ${results.about.failed}                                                ║`);

    // Galleries
    console.log('║                                                               ║');
    console.log('║  📁 GALLERIES:                                                ║');
    console.log(`║     Migrated: ${results.galleries.migrated}                                             ║`);
    console.log(`║     Failed: ${results.galleries.failed}                                               ║`);

    // Gallery images
    console.log('║                                                               ║');
    console.log('║  📷 GALLERY IMAGES:                                           ║');
    console.log(`║     Uploaded: ${results.galleryImages.uploaded}                                            ║`);
    console.log(`║     Failed: ${results.galleryImages.failed}                                              ║`);

    // Total
    const totalUploaded = results.logo.uploaded + results.hero.uploaded +
        results.about.uploaded + results.galleryImages.uploaded;
    const totalFailed = results.logo.failed + results.hero.failed +
        results.about.failed + results.galleryImages.failed;

    console.log('║                                                               ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  TOTAL IMAGES UPLOADED: ${String(totalUploaded).padEnd(36)}║`);
    console.log(`║  TOTAL IMAGES FAILED: ${String(totalFailed).padEnd(38)}║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    // Print failed images if any
    if (totalFailed > 0) {
        console.log('\n⚠️  FAILED UPLOADS:');

        if (results.logo.errors.length > 0) {
            console.log('  Logo:');
            results.logo.errors.forEach(e => console.log(`    - ${e}`));
        }
        if (results.hero.errors.length > 0) {
            console.log('  Hero:');
            results.hero.errors.forEach(e => console.log(`    - ${e.id}: ${e.path}`));
        }
        if (results.about.errors.length > 0) {
            console.log('  About:');
            results.about.errors.forEach(e => console.log(`    - ${e}`));
        }
        if (results.galleryImages.errors.length > 0) {
            console.log('  Gallery Images:');
            results.galleryImages.errors.slice(0, 20).forEach(e =>
                console.log(`    - [${e.gallery}] ${e.image}: ${e.path}`)
            );
            if (results.galleryImages.errors.length > 20) {
                console.log(`    ... and ${results.galleryImages.errors.length - 20} more`);
            }
        }
    }

    if (results.galleries.errors.length > 0) {
        console.log('\n⚠️  FAILED GALLERIES:');
        results.galleries.errors.forEach(e => console.log(`    - ${e.gallery}: ${e.error}`));
    }
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   🚀 MIGRATION: Local Files → MongoDB + Cloudinary            ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    // Validate environment variables
    const requiredEnvVars = [
        'MONGODB_URI',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missingVars.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease update your .env file and try again.');
        process.exit(1);
    }

    console.log('\n📋 Configuration:');
    console.log(`   MongoDB: ${process.env.MONGODB_URI.substring(0, 40)}...`);
    console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    try {
        // Connect to MongoDB
        console.log('\n🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('   ✓ Connected to MongoDB Atlas');

        // Test Cloudinary connection
        console.log('\n☁️  Testing Cloudinary connection...');
        const pingResult = await cloudinary.api.ping();
        console.log('   ✓ Cloudinary connected (status: ' + pingResult.status + ')');

        // Run migrations
        await migrateContent();
        await migrateGalleries();

        // Print summary
        printSummary();

        // Final message
        const allSuccess = results.content.success &&
            results.galleries.failed === 0 &&
            results.logo.failed === 0 &&
            results.hero.failed === 0;

        if (allSuccess) {
            console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
        } else {
            console.log('\n⚠️  MIGRATION COMPLETED WITH SOME ERRORS\n');
        }

        console.log('📝 Next steps:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Test the website at http://localhost:3000');
        console.log('   3. Test the admin panel at http://localhost:3000/admin');
        console.log('   4. Verify all content and images appear correctly');
        console.log('');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
    }
}

// Run migration
migrate();
