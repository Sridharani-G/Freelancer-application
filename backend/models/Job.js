const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true },
    deadline: Date,
    status: { type: String, enum: ['pending', 'in-progress', 'submitted', 'approved', 'paid'], default: 'pending' },
    submittedAt: Date,
    approvedAt: Date,
    deliverables: [String],
});

const jobSchema = new mongoose.Schema(
    {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: [true, 'Job title required'], trim: true },
        description: { type: String, required: [true, 'Description required'] },
        category: { type: String, required: true },
        subCategories: [{ type: String }],
        skillsRequired: [{ type: String }],
        experienceLevel: { type: String, enum: ['entry', 'intermediate', 'expert'], default: 'intermediate' },
        jobType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
        budget: { type: Number, required: true },
        deadline: { type: Date },
        status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
        hiredFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        projectProgress: { type: Number, default: 0, min: 0, max: 100 },
        reviewRequested: { type: Boolean, default: false },
        revisionRequested: { type: Boolean, default: false },
        revisionNotes: { type: String, default: '' },
        paymentStatus: { type: String, enum: ['none', 'partial', 'paid'], default: 'none' },
        milestones: [milestoneSchema],
        applicationsCount: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        isRemote: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        location: {
            address: String,
            city: String,
            state: String,
            country: String,
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
        attachments: [String],
    },
    { timestamps: true }
);

// Text index for search
jobSchema.index({ title: 'text', description: 'text', skillsRequired: 'text', category: 'text' });

module.exports = mongoose.model('Job', jobSchema);
