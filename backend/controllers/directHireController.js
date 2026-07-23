const DirectHireRequest = require('../models/DirectHireRequest');
const Notification = require('../models/Notification');

const createNotif = async (userId, type, title, body, link = '') => {
    await Notification.create({ user: userId, type, title, body, link });
};

exports.createDirectHireRequest = async (req, res, next) => {
    try {
        const { freelancerId, jobTitle, message } = req.body;
        if (!freelancerId) {
            return res.status(400).json({ success: false, message: 'Freelancer is required.' });
        }

        const existing = await DirectHireRequest.findOne({
            client: req.user._id,
            freelancer: freelancerId,
            status: 'pending',
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'You already sent a hire request to this freelancer.' });
        }

        const request = await DirectHireRequest.create({
            client: req.user._id,
            freelancer: freelancerId,
            jobTitle: jobTitle || '',
            message: message || '',
        });

        await createNotif(
            freelancerId,
            'job_accepted',
            'New hire request',
            `${req.user.name || 'A client'} invited you to work together${jobTitle ? ` for "${jobTitle}"` : ''}.`,
            '/freelancer/dashboard'
        );

        res.status(201).json({ success: true, request });
    } catch (error) {
        next(error);
    }
};

exports.getDirectHireRequestsForFreelancer = async (req, res, next) => {
    try {
        const requests = await DirectHireRequest.find({ freelancer: req.user._id })
            .populate('client', 'name avatar email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

exports.getDirectHireRequestsForClient = async (req, res, next) => {
    try {
        const requests = await DirectHireRequest.find({ client: req.user._id })
            .populate('freelancer', 'name avatar email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, requests });
    } catch (error) {
        next(error);
    }
};

exports.updateDirectHireRequestStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const request = await DirectHireRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Hire request not found.' });

        if (req.user.role === 'freelancer') {
            if (request.freelancer.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized.' });
            }
        } else if (req.user.role === 'client') {
            if (request.client.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized.' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        request.status = status;
        request.respondedAt = new Date();
        await request.save();

        await createNotif(
            req.user.role === 'freelancer' ? request.client : request.freelancer,
            'job_accepted',
            req.user.role === 'freelancer' ? 'Hire request accepted' : 'Hire request updated',
            req.user.role === 'freelancer'
                ? `The freelancer accepted your direct hire request${request.jobTitle ? ` for "${request.jobTitle}"` : ''}.`
                : `The client updated the direct hire request status to ${status}.`,
            req.user.role === 'freelancer' ? '/client/dashboard' : '/freelancer/dashboard'
        );

        res.status(200).json({ success: true, request });
    } catch (error) {
        next(error);
    }
};
