/**
 * AI Matching Engine
 *
 * Computes a weighted similarity score (0–100) between a freelancer profile and a job posting.
 *
 * Score = w_skills * S_skills + w_exp * S_exp + w_distance * S_dist + w_budget * S_budget + w_rep * S_rep
 */

const WEIGHTS = {
    skills: 0.30,
    experience: 0.15,
    portfolio: 0.15,
    context: 0.15,
    distance: 0.10,
    budget: 0.05,
    reputation: 0.10,
    language: 0.00,
};

/**
 * Jaccard similarity between two string arrays
 */
function jaccardSimilarity(setA, setB) {
    if (!setA.length || !setB.length) return 0;
    const a = new Set(setA.map((s) => s.toLowerCase().trim()));
    const b = new Set(setB.map((s) => s.toLowerCase().trim()));
    const intersection = [...a].filter((x) => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
}

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeText(value) {
    return normalizeText(value)
        .split(' ')
        .filter(Boolean)
        .filter((token) => token.length > 2);
}

function collectProfileText(profile) {
    const pieces = [
        profile.title,
        profile.bio,
        Array.isArray(profile.skills) ? profile.skills.join(' ') : '',
        Array.isArray(profile.education) ? profile.education.map((entry) => [entry.degree, entry.field, entry.institution].filter(Boolean).join(' ')).join(' ') : '',
        Array.isArray(profile.languages) ? profile.languages.map((entry) => [entry.language, entry.proficiency].filter(Boolean).join(' ')).join(' ') : '',
        Array.isArray(profile.certificates) ? profile.certificates.map((entry) => [entry.name, entry.issuer].filter(Boolean).join(' ')).join(' ') : '',
        Array.isArray(profile.portfolio) ? profile.portfolio.map((item) => [
            item?.title,
            item?.description,
            item?.category,
            item?.subCategory,
            Array.isArray(item?.techStack) ? item.techStack.join(' ') : '',
            Array.isArray(item?.tags) ? item.tags.join(' ') : '',
        ].filter(Boolean).join(' ')).join(' ') : '',
    ];
    return tokenizeText(pieces.join(' '));
}

function collectJobText(job) {
    const pieces = [
        job.title,
        job.description,
        job.category,
        Array.isArray(job.subCategories) ? job.subCategories.join(' ') : '',
        Array.isArray(job.skillsRequired) ? job.skillsRequired.join(' ') : '',
        Array.isArray(job.attachments) ? job.attachments.join(' ') : '',
    ];
    return tokenizeText(pieces.join(' '));
}

function computePortfolioScore(profile, job) {
    const items = Array.isArray(profile.portfolio) ? profile.portfolio.filter((entry) => entry?.isPublished !== false) : [];
    if (!items.length) return 0.35;

    const jobTokens = collectJobText(job);
    const portfolioTokens = items.flatMap((item) => tokenizeText([
        item?.title,
        item?.description,
        item?.category,
        item?.subCategory,
        Array.isArray(item?.techStack) ? item.techStack.join(' ') : '',
        Array.isArray(item?.tags) ? item.tags.join(' ') : '',
    ].filter(Boolean).join(' ')));

    return jaccardSimilarity(portfolioTokens, jobTokens);
}

function computeContextScore(profile, job) {
    const profileTokens = collectProfileText(profile);
    const jobTokens = collectJobText(job);
    return jaccardSimilarity(profileTokens, jobTokens);
}

function computeLanguageScore(profile) {
    const languages = Array.isArray(profile.languages) ? profile.languages.map((entry) => entry?.language).filter(Boolean) : [];
    if (!languages.length) return 0.5;
    return Math.min(1, languages.length / 3);
}

function computeDistanceScore(profile, job) {
    let distScore = 1;
    if (
        profile.location?.lat && profile.location?.lng &&
        job.location?.lat && job.location?.lng
    ) {
        const dist = haversineDistance(
            profile.location.lat, profile.location.lng,
            job.location.lat, job.location.lng
        );
        distScore = Math.max(0, 1 - dist / 50);
    } else if (profile.location?.city || profile.location?.country || job.location?.city || job.location?.country) {
        const profileLocation = [profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(' ').toLowerCase();
        const jobLocation = [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(' ').toLowerCase();
        if (profileLocation && jobLocation) {
            distScore = profileLocation === jobLocation ? 1 : 0.7;
        } else {
            distScore = 0.8;
        }
    }
    return distScore;
}

function computeReputationScore(profile) {
    const badgeBonus = { Bronze: 0, Silver: 0.05, Gold: 0.10, Diamond: 0.15 };
    const reviewsStrength = Math.min((profile.reviewsCount || 0) / 20, 1);
    const successScore = Math.min((profile.successRate || 100) / 100, 1);
    const deliveryScore = Math.min((profile.onTimeDelivery || 100) / 100, 1);
    const completionScore = Math.min((profile.completedProjects || 0) / 25, 1);
    return Math.min(
        ((profile.rating || 0) / 5) * 0.4 +
        (badgeBonus[profile.badge] || 0) * 0.2 +
        reviewsStrength * 0.15 +
        successScore * 0.15 +
        deliveryScore * 0.05 +
        completionScore * 0.05,
        1
    );
}

/**
 * Main matching function
 * @param {Object} freelancerProfile - FreelancerProfile document
 * @param {Object} job - Job document
 * @returns {number} score 0–100
 */
function computeMatchScore(freelancerProfile, job) {
    // 1. Skills Score (Jaccard)
    const skillsScore = jaccardSimilarity(
        freelancerProfile.skills || [],
        job.skillsRequired || []
    );

    // 2. Experience Score
    const experienceYears = (freelancerProfile.experience || []).reduce((acc, e) => {
        const from = e.from ? new Date(e.from) : new Date();
        const to = e.isCurrent ? new Date() : e.to ? new Date(e.to) : new Date();
        return acc + (to - from) / (1000 * 60 * 60 * 24 * 365);
    }, 0);
    // Map experience to job level expectations
    const expMap = { entry: 1, intermediate: 3, expert: 6 };
    const expectedExp = expMap[job.experienceLevel] || 3;
    const expScore = Math.min(experienceYears / (expectedExp * 2), 1); // caps at 1

    // 3. Portfolio/project relevance from published work
    const portfolioScore = computePortfolioScore(freelancerProfile, job);

    // 4. Profile context score from bio/title/education/languages/certificates
    const contextScore = computeContextScore(freelancerProfile, job);

    // 5. Distance Score (Haversine, 50km max radius or city/country overlap)
    const distScore = computeDistanceScore(freelancerProfile, job);

    // 6. Budget Score
    let budgetScore = 0.5;
    if (job.budget && freelancerProfile.hourlyRate) {
        const diff = Math.abs(job.budget - freelancerProfile.hourlyRate) / Math.max(job.budget, 1);
        budgetScore = Math.max(0, 1 - diff);
    }

    // 7. Reputation Score (rating, reviews, success, delivery, completed projects)
    const reputationScore = computeReputationScore(freelancerProfile);

    const languageScore = computeLanguageScore(freelancerProfile);

    const raw =
        WEIGHTS.skills * skillsScore +
        WEIGHTS.experience * expScore +
        WEIGHTS.portfolio * portfolioScore +
        WEIGHTS.context * contextScore +
        WEIGHTS.distance * distScore +
        WEIGHTS.budget * budgetScore +
        WEIGHTS.reputation * reputationScore +
        WEIGHTS.language * languageScore;

    return Math.round(raw * 100);
}

/**
 * Rank freelancers for a given job
 * @param {Array} freelancerProfiles
 * @param {Object} job
 * @returns {Array} sorted with matchScore attached
 */
function rankFreelancers(freelancerProfiles, job) {
    return freelancerProfiles
        .map((fp) => {
            const profile = fp?.toObject ? fp.toObject() : fp;
            const matchScore = computeMatchScore(profile, job);
            return {
                ...profile,
                matchScore,
                recommendation: matchScore >= 80 ? 'Excellent fit' : matchScore >= 60 ? 'Strong fit' : matchScore >= 40 ? 'Potential fit' : 'Low fit',
            };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { computeMatchScore, rankFreelancers, jaccardSimilarity };
