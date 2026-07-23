const Application = require('../models/Application');
const Job = require('../models/Job');
const FreelancerProfile = require('../models/FreelancerProfile');
const Notification = require('../models/Notification');
const { computeMatchScore } = require('../services/aiMatchingEngine');

const createNotif = async (userId, type, title, body, link = '') => {
    await Notification.create({ user: userId, type, title, body, link });
};

// @POST /api/applications
exports.applyJob = async (req, res, next) => {
    try {
        const { jobId, proposal, bidAmount, estimatedDuration, coverLetter } = req.body;
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
        if (job.status !== 'open') return res.status(400).json({ success: false, message: 'Job is not accepting applications.' });

        const existing = await Application.findOne({ job: jobId, freelancer: req.user._id });
        if (existing) return res.status(400).json({ success: false, message: 'You already applied for this job.' });

        // Compute AI match score
        const fp = await FreelancerProfile.findOne({ user: req.user._id });
        const aiMatchScore = fp ? computeMatchScore(fp, job) : 0;

        const application = await Application.create({
            job: jobId, freelancer: req.user._id, client: job.client,
            proposal, bidAmount, estimatedDuration, coverLetter, aiMatchScore,
        });

        await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

        await createNotif(job.client, 'application_received',
            'New Application Received', `A freelancer applied to "${job.title}"`, `/jobs/${jobId}/applications`);

        res.status(201).json({ success: true, application });
    } catch (error) {
        next(error);
    }
};

// @GET /api/applications/job/:jobId
exports.getJobApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ job: req.params.jobId })
            .populate('freelancer', 'name avatar email')
            .populate({ path: 'freelancer', populate: { path: '_id', model: 'FreelancerProfile' } })
            .sort({ aiMatchScore: -1 });
        res.status(200).json({ success: true, applications });
    } catch (error) {
        next(error);
    }
};

// @GET /api/applications/my
exports.getMyApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ freelancer: req.user._id })
            .populate('job', 'title budget status category projectProgress reviewRequested revisionRequested paymentStatus')
            .populate('client', 'name avatar')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, applications });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/applications/:id/status
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('job');
        if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
        if (application.job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        application.status = status;
        if (status === 'hired') {
            application.hiredAt = new Date();
            await Job.findByIdAndUpdate(application.job._id, {
                status: 'in-progress', hiredFreelancer: application.freelancer,
            });
            await createNotif(application.freelancer, 'job_accepted',
                '🎉 Congratulations! You got hired!', `You were hired for "${application.job.title}"`,
                `/applications/${application._id}`);
        } else if (status === 'rejected') {
            application.rejectedAt = new Date();
            await createNotif(application.freelancer, 'job_rejected',
                'Application Update', `Your application for "${application.job.title}" was not selected.`,
                `/applications/${application._id}`);
        }

        await application.save();
        res.status(200).json({ success: true, application });
    } catch (error) {
        next(error);
    }
};

// @DELETE /api/applications/:id
exports.withdrawApplication = async (req, res, next) => {
    try {
        const application = await Application.findOne({ _id: req.params.id, freelancer: req.user._id });
        if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
        application.status = 'withdrawn';
        await application.save();
        res.status(200).json({ success: true, message: 'Application withdrawn.' });
    } catch (error) {
        next(error);
    }
};
