const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyFirebaseIdToken } = require('../utils/firebaseAuth');

test('verifyFirebaseIdToken rejects missing idToken', async () => {
  await assert.rejects(() => verifyFirebaseIdToken('', 'google'), /Firebase ID token is required/);
});

test('verifyFirebaseIdToken rejects missing API key config', async () => {
  const previous = process.env.VITE_FIREBASE_API_KEY;
  delete process.env.VITE_FIREBASE_API_KEY;
  delete process.env.FIREBASE_API_KEY;
  await assert.rejects(() => verifyFirebaseIdToken('token', 'google'), /Firebase API key is not configured/);
  if (previous) process.env.VITE_FIREBASE_API_KEY = previous;
});
