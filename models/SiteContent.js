/**
 * SiteContent Model
 * Stores all editable site content in a single document
 */

const mongoose = require('mongoose');

// Image subdocument schema (for hero images)
const ImageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    path: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String }, // Cloudinary public_id for deletion
    filename: { type: String },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

// Logo schema
const LogoSchema = new mongoose.Schema({
    main: { type: String }, // Cloudinary URL
    mainPublicId: { type: String },
    light: { type: String },
    lightPublicId: { type: String },
    favicon: { type: String },
    faviconPublicId: { type: String }
}, { _id: false });

// Hero section schema
const HeroSchema = new mongoose.Schema({
    subtitle: { type: String, default: '' },
    title: [{ type: String }],
    titleHighlight: { type: String, default: '' },
    description: { type: String, default: '' },
    ctaText: { type: String, default: '' },
    tagline: { type: String, default: '' },
    sideText: { type: String, default: '' },
    megaText: { type: String, default: '' },
    images: [ImageSchema]
}, { _id: false });

// Stat item schema
const StatSchema = new mongoose.Schema({
    number: { type: String },
    label: { type: String }
}, { _id: false });

// About section schema
const AboutSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    title: { type: String, default: '' },
    titleLines: [{ type: String }],
    lead: { type: String, default: '' },
    text: { type: String, default: '' },
    moreText: { type: String, default: '' },
    image: { type: String, default: '' },
    imagePublicId: { type: String },
    signature: { type: String, default: '' },
    signatureRole: { type: String, default: '' },
    stats: [StatSchema]
}, { _id: false });

// Quote schema
const QuoteSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, default: '' },
    author: { type: String, default: '' }
}, { _id: false });

// Testimonial schema
const TestimonialSchema = new mongoose.Schema({
    id: { type: String, required: true },
    text: { type: String, default: '' },
    shortText: { type: String, default: '' },
    authorName: { type: String, default: '' },
    authorInitial: { type: String, default: '' },
    authorRole: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Contact section schema
const ContactSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    whatsappDisplay: { type: String, default: '' },
    phone: { type: String, default: '' },
    phoneDisplay: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    addressLabel: { type: String, default: '' },
    visualText: { type: String, default: '' },
    ctaText: { type: String, default: '' }
}, { _id: false });

// Social link schema
const SocialLinkSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    url: { type: String, default: '' }
}, { _id: false });

// Footer section schema
const FooterSchema = new mongoose.Schema({
    tagline: { type: String, default: '' },
    copyright: { type: String, default: '' },
    creditName: { type: String, default: '' },
    creditPhone: { type: String, default: '' },
    socials: [SocialLinkSchema]
}, { _id: false });

// Marquee section schema
const MarqueeSchema = new mongoose.Schema({
    items: [{ type: String }]
}, { _id: false });

// Category filter schema
const CategorySchema = new mongoose.Schema({
    key: { type: String, default: '' },
    label: { type: String, default: '' }
}, { _id: false });

// SEO schema
const SEOSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: String, default: '' }
}, { _id: false });

// Projects section schema
const ProjectsSchema = new mongoose.Schema({
    label: { type: String, default: '' },
    title: { type: String, default: '' },
    featured: [{ type: String }]
}, { _id: false });

// Section headers schema (titles/labels for sections that don't have their own object)
const SectionHeadersSchema = new mongoose.Schema({
    testimonialsLabel: { type: String, default: '' },
    testimonialsTitle: { type: String, default: '' }
}, { _id: false });

// Main SiteContent schema
const SiteContentSchema = new mongoose.Schema({
    logo: { type: LogoSchema, default: () => ({}) },
    hero: { type: HeroSchema, default: () => ({ title: [], images: [] }) },
    about: { type: AboutSchema, default: () => ({ stats: [] }) },
    quotes: [QuoteSchema],
    projects: { type: ProjectsSchema, default: () => ({ featured: [] }) },
    testimonials: [TestimonialSchema],
    contact: { type: ContactSchema, default: () => ({}) },
    footer: { type: FooterSchema, default: () => ({ socials: [] }) },
    seo: { type: SEOSchema, default: () => ({}) },
    marquee: { type: MarqueeSchema, default: () => ({ items: [] }) },
    categories: [CategorySchema],
    sections: { type: SectionHeadersSchema, default: () => ({}) }
}, {
    timestamps: true,
    collection: 'sitecontent'
});

// Ensure only one document exists
SiteContentSchema.statics.getContent = async function() {
    let content = await this.findOne();
    if (!content) {
        content = await this.create({});
    }
    return content;
};

// Convert to JSON format expected by frontend
SiteContentSchema.methods.toFrontendJSON = function() {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;

    // Remove Cloudinary publicId fields from response
    if (obj.logo) {
        delete obj.logo.mainPublicId;
        delete obj.logo.lightPublicId;
        delete obj.logo.faviconPublicId;
    }
    if (obj.about) {
        delete obj.about.imagePublicId;
    }
    if (obj.hero && obj.hero.images) {
        obj.hero.images = obj.hero.images.map(img => ({
            id: img.id,
            path: img.path
        }));
    }

    return obj;
};

module.exports = mongoose.model('SiteContent', SiteContentSchema);
