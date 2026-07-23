const test = require('node:test');
const assert = require('node:assert/strict');
const { computeMatchScore, rankFreelancers } = require('../services/aiMatchingEngine');

test('computeMatchScore returns a score between 0 and 100', () => {
  const freelancer = {
    skills: ['react', 'node'],
    experience: [{ from: '2020-01-01', isCurrent: true }],
    hourlyRate: 45,
    rating: 4.8,
    badge: 'Gold',
  };
  const job = {
    skillsRequired: ['react', 'node', 'express'],
    experienceLevel: 'intermediate',
    budget: 50,
  };

  const score = computeMatchScore(freelancer, job);
  assert.ok(score >= 0 && score <= 100, `Expected score in range 0-100, received ${score}`);
});

test('rankFreelancers sorts profiles by matchScore descending', () => {
  const profiles = [
    { _id: 'a', skills: ['react'], experience: [], hourlyRate: 30, rating: 4.0, badge: 'Bronze' },
    { _id: 'b', skills: ['react', 'node'], experience: [{ from: '2022-01-01', isCurrent: true }], hourlyRate: 50, rating: 4.8, badge: 'Gold' },
  ];
  const job = {
    skillsRequired: ['react', 'node'],
    experienceLevel: 'intermediate',
    budget: 50,
  };

  const ranked = rankFreelancers(profiles, job);
  assert.equal(ranked[0]._id, 'b');
  assert.ok(ranked[0].matchScore >= ranked[1].matchScore);
});

test('computeMatchScore rewards portfolio, education, bio, and language signals', () => {
  const baseProfile = {
    skills: ['design'],
    experience: [],
    hourlyRate: 30,
    rating: 3.5,
    badge: 'Silver',
    completedProjects: 2,
    successRate: 80,
    availability: 'full-time',
  };
  const enrichedProfile = {
    ...baseProfile,
    portfolio: [{ title: 'AI chatbot', description: 'Built a chatbot with NLP and Python', techStack: ['python', 'nlp'], tags: ['ai', 'chatbot'] }],
    education: [{ degree: 'B.Tech', field: 'Computer Science' }],
    languages: [{ language: 'English', proficiency: 'native' }],
    bio: 'I am passionate about AI products and natural language processing',
    title: 'AI Engineer',
  };
  const job = {
    skillsRequired: ['python', 'ai', 'nlp'],
    experienceLevel: 'entry',
    budget: 1000,
    description: 'Build an AI chatbot for customer support with natural language processing',
    category: 'AI & Machine Learning',
  };

  const baseScore = computeMatchScore(baseProfile, job);
  const enrichedScore = computeMatchScore(enrichedProfile, job);
  assert.ok(enrichedScore > baseScore, `expected richer profile to score higher than base, got ${baseScore} -> ${enrichedScore}`);
});
