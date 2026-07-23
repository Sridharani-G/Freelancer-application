const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePasswordStrength, sanitizeInput, generateOtpCode, hashOtpCode } = require('../utils/security');

test('weak passwords are rejected', () => {
  const result = validatePasswordStrength('password123');
  assert.equal(result.isValid, false);
  assert.ok(result.reasons.length > 0);
});

test('strong passwords are accepted', () => {
  const result = validatePasswordStrength('StrongPass!123');
  assert.equal(result.isValid, true);
  assert.equal(result.reasons.length, 0);
});

test('sanitizes mongo-style operators from input payloads', () => {
  const payload = {
    name: 'Ada',
    profile: { $where: 'delete all' },
    nested: [{ $ne: null }, { note: 'ok' }],
  };

  const result = sanitizeInput(payload);
  assert.equal(result.name, 'Ada');
  assert.equal(result.profile && result.profile.$where, undefined);
  assert.equal(result.profile && result.profile.where, undefined);
  assert.deepEqual(result.nested[0], {});
  assert.equal(result.nested[1].note, 'ok');
});

test('otp helpers produce a six-digit code and deterministic hash', () => {
  const code = generateOtpCode();
  assert.match(code, /^\d{6}$/);
  const hashed = hashOtpCode(code);
  assert.equal(hashOtpCode(code), hashed);
});
