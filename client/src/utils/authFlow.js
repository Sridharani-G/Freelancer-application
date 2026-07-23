export const normalizeProviderId = (providerId = '') => {
  if (!providerId) return 'email';
  const normalized = String(providerId).toLowerCase();
  if (normalized.includes('apple')) return 'apple';
  if (normalized.includes('google')) return 'google';
  return 'email';
};

export const getProviderLabel = (provider) => {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    default:
      return 'Email';
  }
};

export const buildDisplayName = (email = '', displayName = '') => {
  if (displayName && displayName.trim()) return displayName.trim();
  if (email) return email.split('@')[0];
  return 'User';
};
