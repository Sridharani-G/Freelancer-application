const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
    title: String,
    description: String,
    images: [String],
    thumbnailUrl: String,
    introMediaUrl: String,
    mediaType: { type: String, enum: ['image', 'video', ''], default: '' },
    liveUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    techStack: [String],
    cost: { type: Number, default: 0 },
    billingMode: { type: String, enum: ['hourly', 'project'], default: 'hourly' },
    category: String,
    subCategory: String,
    subCategories: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    tags: [{ type: String }],
    completedAt: Date,
});

const experienceSchema = new mongoose.Schema({
    company: String,
    role: String,
    from: Date,
    to: Date,
    isCurrent: { type: Boolean, default: false },
    description: String,
});

const educationSchema = new mongoose.Schema({
    institution: String,
    degree: String,
    field: String,
    from: Date,
    to: Date,
});

const freelancerProfileSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        bio: { type: String, maxlength: 1000, default: '' },
        title: { type: String, default: '' }, // e.g. "Full Stack Developer"
        profileType: { type: String, enum: ['company', 'freelance', 'intern'], default: 'freelance' },
        skills: [{ type: String }],
        billingMode: { type: String, enum: ['hourly', 'project'], default: 'hourly' },
        hourlyRate: { type: Number, default: 0 },
        projectQuote: { type: Number, default: 0 },
        experience: [experienceSchema],
        education: [educationSchema],
        portfolio: [portfolioItemSchema],
        gigs: [portfolioItemSchema],
        certificates: [{ name: String, issuer: String, year: Number, url: String }],
        availability: { type: String, enum: ['full-time', 'part-time', 'weekends', 'unavailable'], default: 'full-time' },
        languages: [{ language: String, proficiency: String }],
        socialLinks: [{ platform: String, url: String }],
        websiteUrl: { type: String, default: '' },
        resumeUrl: { type: String, default: '' },
        introMediaUrl: { type: String, default: '' },
        introMediaType: { type: String, enum: ['image', 'video', ''], default: '' },
        // Reputation
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewsCount: { type: Number, default: 0 },
        completedProjects: { type: Number, default: 0 },
        successRate: { type: Number, default: 100 },
        responseTime: { type: Number, default: 24 }, // hours
        onTimeDelivery: { type: Number, default: 100 }, // percentage
        totalEarnings: { type: Number, default: 0 },
        badge: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Diamond'], default: 'Bronze' },
        aiMatchScore: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false },
        location: {
            address: String,
            city: String,
            state: String,
            country: String,
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Auto-compute badge based on stats
freelancerProfileSchema.methods.computeBadge = function () {
    const score = this.rating * 20 + this.completedProjects * 2 + this.successRate / 10;
    if (score >= 200) this.badge = 'Diamond';
    else if (score >= 120) this.badge = 'Gold';
    else if (score >= 60) this.badge = 'Silver';
    else this.badge = 'Bronze';
};

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);
