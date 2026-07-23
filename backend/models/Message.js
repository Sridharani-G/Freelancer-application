const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        conversationId: { type: String, required: true }, // sorted user IDs joined
        content: { type: String, default: '' },
        type: { type: String, enum: ['text', 'image', 'pdf', 'emoji'], default: 'text' },
        fileUrl: { type: String, default: '' },
        isRead: { type: Boolean, default: false },
        readAt: Date,
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
