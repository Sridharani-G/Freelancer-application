const Review = require('../models/Review');
const FreelancerProfile = require('../models/FreelancerProfile');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

// @POST /api/reviews
exports.createReview = async (req, res, next) => {
    try {
        const { revieweeId, jobId, stars, comment, pros, cons } = req.body;
        const reviewData = {
            reviewer: req.user._id,
            reviewee: revieweeId,
            stars,
            comment,
            pros,
            cons,
        };
        if (jobId) reviewData.job = jobId;

        const review = await Review.create(reviewData);

        // Update freelancer rating
        const allReviews = await Review.find({ reviewee: revieweeId, isPublic: true });
        const numericReviews = allReviews.filter((item) => typeof item?.stars === 'number');
        const avgRating = numericReviews.length > 0
            ? numericReviews.reduce((sum, item) => sum + item.stars, 0) / numericReviews.length
            : 0;
        const fp = await FreelancerProfile.findOne({ user: revieweeId });
        if (fp) {
            fp.rating = Math.round(avgRating * 10) / 10;
            fp.reviewsCount = numericReviews.length;
            fp.computeBadge();
            await fp.save();
        }

        await Notification.create({
            user: revieweeId,
            type: 'review',
            title: '⭐ New Review Received',
            body: `You received a ${stars}-star review.`,
            link: '/profile',
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        next(error);
    }
};

// @GET /api/reviews/user/:userId
exports.getUserReviews = async (req, res, next) => {
    try {
        if (!connectDB.isDbReady()) {
            return res.status(200).json({ success: true, reviews: [] });
        }

        const reviews = await Review.find({ reviewee: req.params.userId, isPublic: true })
            .populate('reviewer', 'name avatar')
            .populate('job', 'title')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};
