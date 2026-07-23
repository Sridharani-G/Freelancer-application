const suspiciousHits = new Map();

const abuseProtection = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const entry = suspiciousHits.get(ip) || { count: 0, resetAt: now + 60_000 };

    if (entry.resetAt <= now) {
        entry.count = 0;
        entry.resetAt = now + 60_000;
    }

    if (req.method !== 'GET' && /\.env|\$where|union select|<script|javascript:/i.test(JSON.stringify(req.body || {}))) {
        entry.count += 1;
        suspiciousHits.set(ip, entry);
        if (entry.count >= 5) {
            return res.status(429).json({ success: false, message: 'Suspicious activity detected. Access temporarily blocked.' });
        }
    }

    suspiciousHits.set(ip, entry);
    next();
};

module.exports = { abuseProtection };
