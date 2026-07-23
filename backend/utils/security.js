const crypto = require('crypto');

const DEFAULT_PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

const SENSITIVE_KEYS = new Set(['$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$or', '$and', '$not', '$exists', '$regex']);

function validatePasswordStrength(password, policy = DEFAULT_PASSWORD_POLICY) {
  const reasons = [];
  if (!password || password.length < policy.minLength) {
    reasons.push(`Password must be at least ${policy.minLength} characters long.`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password || '')) {
    reasons.push('Password must include at least one uppercase letter.');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password || '')) {
    reasons.push('Password must include at least one lowercase letter.');
  }
  if (policy.requireNumber && !/[0-9]/.test(password || '')) {
    reasons.push('Password must include at least one number.');
  }
  if (policy.requireSymbol && !/[!@#$%^&*(),.?":{}|<>]/.test(password || '')) {
    reasons.push('Password must include at least one symbol.');
  }
  return { isValid: reasons.length === 0, reasons };
}

function sanitizeInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item));
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key) || key.startsWith('$')) {
        continue;
      }
      sanitized[key] = sanitizeInput(nestedValue);
    }
    return sanitized;
  }
  return value;
}

function createHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOtpCode(length = 6) {
  const digits = '0123456789';
  return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
}

function hashOtpCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function sanitizeForLogging(value) {
  return String(value || '').slice(0, 200).replace(/\s+/g, ' ');
}

module.exports = { validatePasswordStrength, sanitizeInput, createHash, createToken, generateOtpCode, hashOtpCode, sanitizeForLogging };
