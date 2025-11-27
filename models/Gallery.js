/**
 * Gallery Model
 * Stores gallery information and images
 */

const mongoose = require('mongoose');

// Gallery image schema
const GalleryImageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    filename: { type: String },
    path: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String }, // Cloudinary public_id for deletion
    originalName: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// Main Gallery schema
const GallerySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    folder: { type: String }, // Cloudinary folder name
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    coverImage: { type: String }, // Cloudinary URL
    coverImagePublicId: { type: String },
    images: [GalleryImageSchema],
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    collection: 'galleries'
});

// Index for faster queries
GallerySchema.index({ id: 1 });
GallerySchema.index({ isActive: 1, isFeatured: 1 });

// Convert to JSON format expected by frontend
GallerySchema.methods.toFrontendJSON = function() {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    delete obj.updatedAt;
    delete obj.coverImagePublicId;

    // Remove publicId from images
    if (obj.images) {
        obj.images = obj.images.map(img => ({
            id: img.id,
            filename: img.filename,
            path: img.path,
            originalName: img.originalName,
            size: img.size,
            uploadedAt: img.uploadedAt
        }));
    }

    return obj;
};

// Static method to get all galleries as frontend JSON
GallerySchema.statics.getAllForFrontend = async function() {
    const galleries = await this.find().sort({ order: 1, createdAt: 1 });
    return galleries.map(g => g.toFrontendJSON());
};

module.exports = mongoose.model('Gallery', GallerySchema);
