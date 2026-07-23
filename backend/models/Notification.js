const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: ['new_job', 'application_received', 'job_accepted', 'job_rejected', 'milestone_approved', 'payment_released', 'message', 'review', 'project_update', 'revision_requested', 'partial_payment', 'system'],
            required: true,
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        link: { type: String, default: '' },
        isRead: { type: Boolean, default: false },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
