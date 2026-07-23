const mongoose = require('mongoose');

const clientProfileSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        company: { type: String, default: '' },
        bio: { type: String, default: '' },
        website: { type: String, default: '' },
        industry: { type: String, default: '' },
        totalSpent: { type: Number, default: 0 },
        jobsPosted: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
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

module.exports = mongoose.model('ClientProfile', clientProfileSchema);
