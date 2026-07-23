const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { isRead: true } });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};
