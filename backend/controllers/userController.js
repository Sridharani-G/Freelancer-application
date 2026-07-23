const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Review = require('../models/Review');

// @GET /api/users/profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        let profile = null;
        if (user.role === 'freelancer') {
            profile = await FreelancerProfile.findOne({ user: user._id });
        } else if (user.role === 'client') {
            profile = await ClientProfile.findOne({ user: user._id });
        }
        res.status(200).json({ success: true, user, profile });
    } catch (error) {
        next(error);
    }
};

// @GET /api/users/:id
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('name email avatar role location _id');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @GET /api/users/:id/freelancer-profile
exports.getFreelancerProfileById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password -refreshToken');
        if (!user || user.role !== 'freelancer') {
            return res.status(404).json({ success: false, message: 'Freelancer not found.' });
        }

        const profile = await FreelancerProfile.findOne({ user: user._id }).populate('user', 'name avatar location role');
        const reviews = await Review.find({ reviewee: user._id, isPublic: true })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            profile: profile ? { ...profile.toObject(), reviews, user: profile.user || user } : { user, reviews },
        });
    } catch (error) {
        next(error);
    }
};

// @PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const {
            // User fields
            name, phone, avatar,
            'location.city': locationCity, 'location.state': locationState, 'location.country': locationCountry,
            // Freelancer profile fields
            bio, title, profileType, skills, billingMode, hourlyRate, projectQuote, availability,
            githubUrl, linkedinUrl, websiteUrl, introMediaUrl, introMediaType,
            experience, education, portfolio, gigs, certificates, languages, socialLinks,
        } = req.body;

        // Update User
        const userUpdates = {};
        if (name) userUpdates.name = name;
        if (phone !== undefined) userUpdates.phone = phone;
        if (avatar !== undefined) userUpdates.avatar = avatar;
        if (locationCity !== undefined) userUpdates['location.city'] = locationCity;
        if (locationState !== undefined) userUpdates['location.state'] = locationState;
        if (locationCountry !== undefined) userUpdates['location.country'] = locationCountry;

        const user = await User.findByIdAndUpdate(req.user._id, { $set: userUpdates }, { new: true, runValidators: true });

        let profile = null;
        if (req.user.role === 'freelancer') {
            const profileUpdates = {};
            if (bio !== undefined) profileUpdates.bio = bio;
            if (title !== undefined) profileUpdates.title = title;
            if (profileType !== undefined) profileUpdates.profileType = profileType;
            if (skills !== undefined) profileUpdates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
            if (billingMode !== undefined) profileUpdates.billingMode = billingMode;
            if (hourlyRate !== undefined) profileUpdates.hourlyRate = Number(hourlyRate);
            if (projectQuote !== undefined) profileUpdates.projectQuote = Number(projectQuote);
            if (availability !== undefined) profileUpdates.availability = availability;
            if (githubUrl !== undefined) profileUpdates.githubUrl = githubUrl;
            if (linkedinUrl !== undefined) profileUpdates.linkedinUrl = linkedinUrl;
            if (websiteUrl !== undefined) profileUpdates.websiteUrl = websiteUrl;
            if (introMediaUrl !== undefined) profileUpdates.introMediaUrl = introMediaUrl;
            if (introMediaType !== undefined) profileUpdates.introMediaType = introMediaType;
            if (experience !== undefined) profileUpdates.experience = experience;
            if (education !== undefined) profileUpdates.education = education;
            if (portfolio !== undefined) {
                profileUpdates.portfolio = Array.isArray(portfolio) ? portfolio.map(item => ({
                    ...item,
                    techStack: Array.isArray(item.techStack)
                        ? item.techStack
                        : typeof item.techStack === 'string'
                            ? item.techStack.split(',').map(t => t.trim()).filter(Boolean)
                            : [],
                    tags: Array.isArray(item.tags)
                        ? item.tags
                        : typeof item.tags === 'string'
                            ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
                            : [],
                    cost: item.cost !== undefined && item.cost !== '' ? Number(item.cost) : 0,
                    billingMode: item.billingMode || 'hourly',
                    subCategory: item.subCategory || (Array.isArray(item.subCategories) ? item.subCategories[0] || '' : ''),
                    subCategories: Array.isArray(item.subCategories)
                        ? item.subCategories
                        : typeof item.subCategories === 'string'
                            ? item.subCategories.split(',').map((entry) => entry.trim()).filter(Boolean)
                            : [],
                    isPublished: Boolean(item.isPublished),
                })) : portfolio;
            }
            if (certificates !== undefined) profileUpdates.certificates = certificates;
            if (languages !== undefined) profileUpdates.languages = languages;
            if (socialLinks !== undefined) profileUpdates.socialLinks = socialLinks;
            if (gigs !== undefined) {
                profileUpdates.gigs = Array.isArray(gigs) ? gigs.map(item => ({
                    ...item,
                    techStack: Array.isArray(item.techStack)
                        ? item.techStack
                        : typeof item.techStack === 'string'
                            ? item.techStack.split(',').map(t => t.trim()).filter(Boolean)
                            : [],
                    tags: Array.isArray(item.tags)
                        ? item.tags
                        : typeof item.tags === 'string'
                            ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
                            : [],
                    cost: item.cost !== undefined && item.cost !== '' ? Number(item.cost) : 0,
                    billingMode: item.billingMode || 'hourly',
                    subCategory: item.subCategory || (Array.isArray(item.subCategories) ? item.subCategories[0] || '' : ''),
                    subCategories: Array.isArray(item.subCategories)
                        ? item.subCategories
                        : typeof item.subCategories === 'string'
                            ? item.subCategories.split(',').map((entry) => entry.trim()).filter(Boolean)
                            : [],
                    isPublished: Boolean(item.isPublished),
                })) : gigs;
            }

            profile = await FreelancerProfile.findOneAndUpdate(
                { user: req.user._id },
                { $set: profileUpdates },
                { new: true, upsert: true }
            );
        } else if (req.user.role === 'client') {
            // For clients, just handle simple updates
            profile = await ClientProfile.findOne({ user: req.user._id });
        }

        res.status(200).json({ success: true, user, profile });
    } catch (error) {
        next(error);
    }
};
