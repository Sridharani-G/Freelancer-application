const buildClientUrl = (req, fallback = 'http://localhost:5173') => {
  const origin = req?.headers?.origin || req?.get?.('origin') || '';
  if (origin) return origin.replace(/\/$/, '');
  if (req?.headers?.referer) {
    try {
      const parsed = new URL(req.headers.referer);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      // ignore
    }
  }
  return fallback;
};

const buildAuthRedirectUrl = (req, path = '', fallback = 'http://localhost:5173') => {
  const baseUrl = buildClientUrl(req, fallback);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

module.exports = { buildClientUrl, buildAuthRedirectUrl };
