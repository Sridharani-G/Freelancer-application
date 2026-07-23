const Job = require('../models/Job');
const Application = require('../models/Application');
const FreelancerProfile = require('../models/FreelancerProfile');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');
const { rankFreelancers, computeMatchScore } = require('../services/aiMatchingEngine');

// @GET /api/jobs
exports.getJobs = async (req, res, next) => {
    try {
        const dbState = await connectDB();
        if (!dbState?.connected) {
            return res.status(200).json({ success: true, total: 0, page: 1, pages: 0, jobs: [] });
        }

        const { search, category, skills, minBudget, maxBudget, experienceLevel, jobType, location, page = 1, limit = 12 } = req.query;
        const query = { status: 'open' };

        if (search) query.$text = { $search: search };
        if (category) query.category = category;
        if (experienceLevel) query.experienceLevel = experienceLevel;
        if (jobType) query.jobType = jobType;
        if (minBudget || maxBudget) {
            query.budget = {};
            if (minBudget) query.budget.$gte = Number(minBudget);
            if (maxBudget) query.budget.$lte = Number(maxBudget);
        }
        if (location) {
            const locationRegex = new RegExp(location.trim(), 'i');
            query.$or = [
                { 'location.city': locationRegex },
                { 'location.state': locationRegex },
                { 'location.country': locationRegex },
                { 'location.address': locationRegex },
            ];
        }
        if (skills) {
            const skillArr = skills.split(',').map((s) => s.trim());
            query.skillsRequired = { $in: skillArr };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Job.countDocuments(query);
        const jobs = await Job.find(query)
            .populate('client', 'name avatar')
            .sort({ isFeatured: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), jobs });
    } catch (error) {
        return res.status(200).json({ success: true, total: 0, page: 1, pages: 0, jobs: [] });
    }
};

// @GET /api/jobs/:id
exports.getJob = async (req, res, next) => {
    try {
        const job = await Job.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('client', 'name avatar email location');

        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

        // Attach AI-ranked freelancers (top 5) for clients
        let rankedFreelancers = [];
        if (req.user?.role === 'client' && req.user._id.toString() === job.client._id.toString()) {
            const profiles = await FreelancerProfile.find().populate('user', 'name avatar email');
            rankedFreelancers = rankFreelancers(profiles, job).slice(0, 5);
        }

        res.status(200).json({ success: true, job, rankedFreelancers });
    } catch (error) {
        next(error);
    }
};

// @POST /api/jobs
exports.createJob = async (req, res, next) => {
    try {
        const job = await Job.create({ ...req.body, client: req.user._id });
        res.status(201).json({ success: true, job });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/jobs/:id
exports.updateJob = async (req, res, next) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, client: req.user._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found or not authorized.' });
        Object.assign(job, req.body);
        await job.save();
        res.status(200).json({ success: true, job });
    } catch (error) {
        next(error);
    }
};

// @DELETE /api/jobs/:id
exports.deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findOneAndDelete({ _id: req.params.id, client: req.user._id });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found or not authorized.' });
        res.status(200).json({ success: true, message: 'Job deleted.' });
    } catch (error) {
        next(error);
    }
};

// @POST /api/jobs/:id/save
exports.toggleSaveJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        const idx = job.savedBy.indexOf(req.user._id);
        if (idx > -1) job.savedBy.splice(idx, 1);
        else job.savedBy.push(req.user._id);
        await job.save();
        res.status(200).json({ success: true, saved: idx === -1 });
    } catch (error) {
        next(error);
    }
};

// @GET /api/jobs/:id/ai-matches
exports.getAIMatches = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        const profiles = await FreelancerProfile.find({ isVerified: true }).populate('user', 'name avatar email');
        const ranked = rankFreelancers(profiles, job).slice(0, 10);
        res.status(200).json({ success: true, matches: ranked });
    } catch (error) {
        next(error);
    }
};

// @GET /api/jobs/client/my-jobs
exports.getMyJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ client: req.user._id }).sort({ createdAt: -1 }).lean();
        const applications = await Application.find({ client: req.user._id })
            .populate('freelancer', 'name avatar email')
            .sort({ aiMatchScore: -1 })
            .lean();

        const jobsWithApps = jobs.map(job => ({
            ...job,
            applications: applications.filter(app => app.job.toString() === job._id.toString())
        }));

        res.status(200).json({ success: true, jobs: jobsWithApps });
    } catch (error) {
        next(error);
    }
};

const createNotif = async (userId, type, title, body, link = '') => {
    await Notification.create({ user: userId, type, title, body, link });
};

// @PUT /api/jobs/:id/progress
exports.updateProjectProgress = async (req, res, next) => {
    try {
        const { progress } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        if (!job.hiredFreelancer || job.hiredFreelancer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (job.status !== 'in-progress') {
            return res.status(400).json({ success: false, message: 'Progress can only be updated for in-progress jobs.' });
        }

        const numericProgress = Number(progress);
        if (Number.isNaN(numericProgress) || numericProgress < 0 || numericProgress > 100) {
            return res.status(400).json({ success: false, message: 'Progress must be a number between 0 and 100.' });
        }

        job.projectProgress = numericProgress;
        job.revisionRequested = false;
        job.revisionNotes = '';
        if (numericProgress >= 100) {
            job.reviewRequested = true;
            job.projectProgress = 100;
        }

        await job.save();

        await createNotif(job.client, 'project_update',
            'Project progress updated',
            `The freelancer updated progress to ${job.projectProgress}% for "${job.title}".`,
            `/jobs/${job._id}`);

        res.status(200).json({ success: true, job });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/jobs/:id/client-action
exports.clientProjectAction = async (req, res, next) => {
    try {
        const { action, notes } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (!['approve', 'request_revision', 'release_half'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

        if (action === 'approve') {
            if (job.projectProgress < 100) {
                return res.status(400).json({ success: false, message: 'Project must be at 100% to approve completion.' });
            }
            job.status = 'completed';
            job.reviewRequested = false;
            job.revisionRequested = false;
            job.paymentStatus = 'paid';
            job.revisionNotes = '';

            await createNotif(job.hiredFreelancer, 'payment_released',
                'Project completed and paid',
                `The client approved "${job.title}" and released final payment.`,
                `/jobs/${job._id}`);
        } else if (action === 'request_revision') {
            job.status = 'in-progress';
            job.revisionRequested = true;
            job.reviewRequested = false;
            job.revisionNotes = String(notes || 'Please make the requested revisions.');
            if (job.projectProgress > 50) job.projectProgress = 50;

            await createNotif(job.hiredFreelancer, 'revision_requested',
                'Revision requested',
                `The client requested revisions for "${job.title}".`,
                `/jobs/${job._id}`);
        } else if (action === 'release_half') {
            if (job.projectProgress < 50) {
                return res.status(400).json({ success: false, message: 'Half payment is only available at 50% progress or more.' });
            }
            job.paymentStatus = 'partial';
            job.reviewRequested = false;
            job.revisionRequested = false;
            job.revisionNotes = '';

            await createNotif(job.hiredFreelancer, 'partial_payment',
                'Half payment released',
                `The client released a partial payment for "${job.title}".`,
                `/jobs/${job._id}`);
        }

        await job.save();
        res.status(200).json({ success: true, job });
    } catch (error) {
        next(error);
    }
};
