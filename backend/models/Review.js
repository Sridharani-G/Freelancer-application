const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        stars: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, maxlength: 1000 },
        pros: { type: String, default: '' },
        cons: { type: String, default: '' },
        isPublic: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// One review per job per reviewer when a job is attached, but allow quick profile reviews without a job
reviewSchema.index({ job: 1, reviewer: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
