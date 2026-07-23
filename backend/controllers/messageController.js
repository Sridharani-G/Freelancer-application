const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get or create conversation ID (sorted user IDs)
const getConversationId = (id1, id2) => [id1.toString(), id2.toString()].sort().join('_');

// @GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        // Get last message of each conversation
        const msgs = await Message.aggregate([
            { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }], isDeleted: false } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$conversationId', lastMessage: { $first: '$$ROOT' } } },
            { $sort: { 'lastMessage.createdAt': -1 } },
        ]);

        // Populate partner info
        const conversations = await Promise.all(
            msgs.map(async (m) => {
                const partnerId = m.lastMessage.sender.toString() === userId
                    ? m.lastMessage.receiver
                    : m.lastMessage.sender;
                const partner = await User.findById(partnerId).select('name avatar _id');
                const unread = await Message.countDocuments({ conversationId: m._id, receiver: req.user._id, isRead: false });
                return { conversationId: m._id, partner, lastMessage: m.lastMessage, unread };
            })
        );

        res.status(200).json({ success: true, conversations });
    } catch (error) {
        next(error);
    }
};

// @GET /api/messages/:userId
exports.getMessages = async (req, res, next) => {
    try {
        const conversationId = getConversationId(req.user._id, req.params.userId);
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const messages = await Message.find({ conversationId, isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('sender', 'name avatar');

        // Mark as read
        await Message.updateMany(
            { conversationId, receiver: req.user._id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        res.status(200).json({ success: true, messages: messages.reverse() });
    } catch (error) {
        next(error);
    }
};

// @POST /api/messages/:userId
exports.sendMessage = async (req, res, next) => {
    try {
        const { content, type, fileUrl } = req.body;
        const receiver = await User.findById(req.params.userId).select('_id');
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'Recipient not found.' });
        }

        const conversationId = getConversationId(req.user._id, req.params.userId);
        const message = await Message.create({
            sender: req.user._id,
            receiver: req.params.userId,
            conversationId,
            content,
            type: type || 'text',
            fileUrl,
        });
        const populated = await message.populate('sender', 'name avatar');

        // Create a notification for the recipient
        const notification = await Notification.create({
            user: req.params.userId,
            type: 'message',
            title: `${req.user.name || 'Someone'} sent you a message`,
            body: content ? content.slice(0, 120) : 'You received a new attachment',
            link: `/chat/${req.user._id}`,
        });

        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const recipientSockets = onlineUsers?.get(req.params.userId);
        if (io && recipientSockets?.size) {
            recipientSockets.forEach((socketId) => io.to(socketId).emit('notification:new', notification));
        }

        res.status(201).json({ success: true, message: populated });
    } catch (error) {
        next(error);
    }
};
