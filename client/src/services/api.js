import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    timeout: 20000, // 20 seconds
});

// ── CSRF token management ──────────────────────────────────────────────────
// Fetched once per session, cached in memory. If backend is restarting we
// fall back silently — server ignores CSRF on GET/HEAD/OPTIONS anyway.
let _csrfToken = null;
let _csrfFetching = null;

const getCookieCsrf = () => {
    const match = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

const fetchCsrf = () => {
    if (_csrfToken) return Promise.resolve(_csrfToken);
    if (_csrfFetching) return _csrfFetching;

    _csrfFetching = axios.get('/api/auth/csrf-token', {
        withCredentials: true,
        timeout: 5000, // short — never block main request for long
    }).then(res => {
        _csrfToken = res.data?.csrfToken || getCookieCsrf() || '';
        return _csrfToken;
    }).catch(() => {
        // If CSRF endpoint is down (e.g. server restarting) use cookie fallback
        _csrfToken = getCookieCsrf() || '';
        return _csrfToken;
    }).finally(() => {
        _csrfFetching = null;
    });

    return _csrfFetching;
};

// Eagerly warm up the CSRF token on module load
fetchCsrf();

// Attach auth token + CSRF to every request
API.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Skip CSRF for GET / HEAD / OPTIONS — server ignores it anyway
    const method = (config.method || 'get').toLowerCase();
    if (!['get', 'head', 'options'].includes(method)) {
        const csrf = _csrfToken || getCookieCsrf() || await fetchCsrf();
        if (csrf) {
            config.headers = config.headers || {};
            config.headers['X-CSRF-Token'] = csrf;
        }
    }

    return config;
});

// ── Response interceptor ───────────────────────────────────────────────────
API.interceptors.response.use(
    (res) => res,
    async (error) => {
        // Invalidate cached CSRF on 403 (stale token after server restart)
        if (error.response?.status === 403) {
            _csrfToken = null;
        }

        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            const isAuthRoute = currentPath === '/login' || currentPath === '/register';
            if (!isAuthRoute) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        // Friendly handling for 502 Bad Gateway from reverse proxy or upstream services
        if (error.response?.status === 502) {
            error.friendlyMessage = 'Server unavailable (502 Bad Gateway). The backend or a gateway may be restarting.';
            // Auto-retry once for idempotent GET requests using the same configured API instance
            try {
                const cfg = error.config || {};
                const method = (cfg.method || 'get').toLowerCase();
                if (method === 'get' && !cfg.__retry) {
                    cfg.__retry = true;
                    await new Promise((r) => setTimeout(r, 700));
                    return API(cfg);
                }
            } catch (e) {
                // fall through to default rejection
            }
        }

        if (error.code === 'ECONNABORTED') {
            error.friendlyMessage = 'Request timed out — the server may be restarting. Please try again.';
        } else if (!error.response) {
            error.friendlyMessage = 'Network error. Please check your connection.';
        }

        return Promise.reject(error);
    }
);

export default API;
