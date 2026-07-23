const mongoose = require('mongoose');

const directHireRequestSchema = new mongoose.Schema(
    {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        jobTitle: { type: String, default: '' },
        message: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
        respondedAt: Date,
    },
    { timestamps: true }
);

directHireRequestSchema.index({ client: 1, freelancer: 1, status: 1 });

module.exports = mongoose.model('DirectHireRequest', directHireRequestSchema);
