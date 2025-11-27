/**
 * Cloudinary Configuration
 * Handles image upload to Cloudinary cloud storage
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Create Cloudinary storage for multer
 * @param {string} folder - The folder name in Cloudinary
 * @returns {CloudinaryStorage} Configured storage instance
 */
function createCloudinaryStorage(folder) {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `leah-budik/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            transformation: [{ quality: 'auto:good' }],
            // Generate unique filename
            public_id: (req, file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
                return `${nameWithoutExt}-${uniqueSuffix}`;
            }
        }
    });
}

/**
 * Create multer upload middleware for a specific folder
 * @param {string} folder - The folder name in Cloudinary
 * @returns {multer} Configured multer instance
 */
function createUploader(folder) {
    return multer({
        storage: createCloudinaryStorage(folder),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|webp|gif/;
            const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
            const mimetype = allowedTypes.test(file.mimetype);

            if (extname && mimetype) {
                return cb(null, true);
            }
            cb(new Error('Only image files are allowed!'));
        }
    });
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public_id of the image to delete
 * @returns {Promise} Cloudinary deletion result
 */
async function deleteImage(publicId) {
    if (!publicId) return null;
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return null;
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public_ids to delete
 * @returns {Promise} Cloudinary deletion result
 */
async function deleteImages(publicIds) {
    if (!publicIds || publicIds.length === 0) return null;
    try {
        return await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        return null;
    }
}

// Pre-configured uploaders for different sections
const uploaders = {
    hero: createUploader('hero'),
    logo: createUploader('logo'),
    gallery: (folderName) => createUploader(`galleries/${folderName}`),
    about: createUploader('about')
};

module.exports = {
    cloudinary,
    createUploader,
    deleteImage,
    deleteImages,
    uploaders
};
