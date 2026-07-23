const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');
const connectDB = require('../config/db');

// @GET /api/admin/stats
exports.getStats = async (req, res, next) => {
    try {
        const dbState = await connectDB();
        if (!dbState?.connected) {
            return res.status(200).json({
                success: true,
                stats: {
                    totalUsers: 0,
                    totalFreelancers: 0,
                    totalClients: 0,
                    totalJobs: 0,
                    totalApplications: 0,
                    totalReviews: 0,
                },
                userGrowth: [],
                jobsByCategory: [],
                topFreelancers: [],
            });
        }

        const [totalUsers, totalFreelancers, totalClients, totalJobs, totalApplications, totalReviews] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'freelancer' }),
            User.countDocuments({ role: 'client' }),
            Job.countDocuments(),
            Application.countDocuments(),
            Review.countDocuments(),
        ]);

        // Monthly user growth (last 6 months)
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const jobsByCategory = await Job.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        const topFreelancers = await FreelancerProfile.find()
            .populate('user', 'name avatar email')
            .sort({ rating: -1, completedProjects: -1 })
            .limit(5)
            .select('user rating completedProjects badge totalEarnings');

        res.status(200).json({
            success: true,
            stats: { totalUsers, totalFreelancers, totalClients, totalJobs, totalApplications, totalReviews },
            userGrowth, jobsByCategory, topFreelancers,
        });
    } catch (error) {
        next(error);
    }
};

// @GET /api/admin/users
exports.getUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        const query = {};
        if (role) query.role = role;
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            User.countDocuments(query),
        ]);
        res.status(200).json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
    try {
        const { isActive, isApproved, role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isActive, isApproved, role }, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted.' });
    } catch (error) {
        next(error);
    }
};

// @GET /api/admin/jobs
exports.getAllJobs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const [jobs, total] = await Promise.all([
            Job.find().populate('client', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Job.countDocuments(),
        ]);
        res.status(200).json({ success: true, jobs, total });
    } catch (error) {
        next(error);
    }
};

// @GET /api/admin/freelancers
exports.getFreelancers = async (req, res, next) => {
    try {
        const dbState = await connectDB();
        if (!dbState?.connected) {
            return res.status(200).json({ success: true, freelancers: [] });
        }

        const freelancers = await FreelancerProfile.find()
            .populate('user', 'name email avatar location role')
            .sort({ rating: -1, completedProjects: -1 })
            .limit(20);

        res.status(200).json({ success: true, freelancers });
    } catch (error) {
        res.status(200).json({ success: true, freelancers: [] });
    }
};

// @GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ success: true, logs });
    } catch (error) {
        next(error);
    }
};

// @GET /api/admin/public-stats  (no auth required)
exports.getPublicStats = async (req, res) => {
    try {
        const [totalJobs, openJobs, freelancerProfiles, jobCities, freelancerCities, freelancerUserCities, jobsByCategory] = await Promise.all([
            Job.countDocuments(),
            Job.countDocuments({ status: 'open' }),
            FreelancerProfile.find().select('location rating successRate').lean(),
            Job.distinct('location.city'),
            FreelancerProfile.distinct('location.city'),
            User.distinct('location.city', { role: 'freelancer' }),
            Job.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ])
        ]);

        // Unique cities from distinct query + fallback checks
        const citySet = new Set();
        jobCities.forEach(city => {
            if (city) citySet.add(city.trim().toLowerCase());
        });
        freelancerCities.forEach(city => {
            if (city) citySet.add(city.trim().toLowerCase());
        });
        freelancerUserCities.forEach(city => {
            if (city) citySet.add(city.trim().toLowerCase());
        });
        freelancerProfiles.forEach(f => {
            const city = f.location?.city || '';
            if (city) citySet.add(city.trim().toLowerCase());
        });

        // Satisfaction: average of (rating/5)*100 and successRate across all freelancers
        const ratingsData = freelancerProfiles
            .map(f => ({ rating: Number(f.rating) || 0, successRate: Number(f.successRate) || 100 }))
            .filter(f => f.rating > 0);

        const avgSatisfaction = ratingsData.length > 0
            ? Math.round(
                ratingsData.reduce((sum, f) => sum + ((f.rating / 5) * 100 + f.successRate) / 2, 0) / ratingsData.length
            )
            : 0;

        // Top matches: take top 3 freelancer-job combinations
        const topFreelancers = await FreelancerProfile.find()
            .populate('user', 'name avatar')
            .select('skills hourlyRate rating user gigs')
            .limit(10)
            .lean();

        const topJobs = await Job.find({ status: 'open' })
            .select('title skillsRequired budget category')
            .limit(10)
            .lean();

        // Compute matches
        const matches = [];
        for (const fp of topFreelancers) {
            for (const job of topJobs) {
                const fSkills = fp.skills || [];
                const jSkills = job.skillsRequired || [];
                let skillsScore = 0;
                if (fSkills.length && jSkills.length) {
                    const setA = new Set(fSkills.map(s => s.toLowerCase().trim()));
                    const setB = new Set(jSkills.map(s => s.toLowerCase().trim()));
                    const intersect = [...setA].filter(x => setB.has(x)).length;
                    const union = new Set([...setA, ...setB]).size;
                    skillsScore = union > 0 ? intersect / union : 0;
                }
                const fRate = fp.hourlyRate || 0;
                const jBudget = job.budget || 0;
                let budgetScore = 0.5;
                if (fRate > 0 && jBudget > 0) {
                    const diff = Math.abs(jBudget - fRate) / Math.max(jBudget, 1);
                    budgetScore = Math.max(0, 1 - diff);
                }
                const score = Math.round((skillsScore * 0.6 + budgetScore * 0.4) * 100);
                matches.push({
                    freelancerName: fp.user?.name || 'Freelancer',
                    freelancerAvatar: fp.user?.avatar || '',
                    jobTitle: job.title,
                    score: Math.max(45, Math.min(97, score)),
                    skillsMatch: Math.round(skillsScore * 100),
                    budgetFit: Math.round(budgetScore * 100),
                });
            }
        }
        matches.sort((a, b) => b.score - a.score);

        res.status(200).json({
            success: true,
            stats: {
                openJobs,
                totalJobs,
                freelancerProfiles: freelancerProfiles.length,
                cities: citySet.size,
                satisfaction: avgSatisfaction,
            },
            topMatches: matches.slice(0, 3),
            categories: jobsByCategory.map(c => ({ name: c._id || 'General', count: c.count })),
        });
    } catch (error) {
        console.error('getPublicStats error:', error.message);
        res.status(200).json({
            success: true,
            stats: { openJobs: 0, totalJobs: 0, freelancerProfiles: 0, cities: 0, satisfaction: 0 },
            topMatches: [],
            categories: [],
        });
    }
};
