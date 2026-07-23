const test = require('node:test');
const assert = require('node:assert/strict');
const { buildClientUrl, buildAuthRedirectUrl } = require('../utils/authRedirect');

test('buildClientUrl prefers request origin over environment fallback', () => {
  const req = { headers: { origin: 'http://localhost:5174' } };
  const result = buildClientUrl(req, 'http://localhost:5173');
  assert.equal(result, 'http://localhost:5174');
});

test('buildAuthRedirectUrl preserves the originating path when building a client redirect', () => {
  const req = { headers: { origin: 'http://localhost:5174' } };
  const result = buildAuthRedirectUrl(req, '/reset-password/abc123');
  assert.equal(result, 'http://localhost:5174/reset-password/abc123');
});
