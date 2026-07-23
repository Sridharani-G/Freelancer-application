const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        proposal: { type: String, required: true, maxlength: 3000 },
        bidAmount: { type: Number, required: true },
        estimatedDuration: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'shortlisted', 'hired', 'rejected', 'withdrawn'], default: 'pending' },
        aiMatchScore: { type: Number, default: 0 }, // 0–100
        coverLetter: { type: String, default: '' },
        attachments: [String],
        hiredAt: Date,
        rejectedAt: Date,
    },
    { timestamps: true }
);

// One application per freelancer per job
applicationSchema.index({ job: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
