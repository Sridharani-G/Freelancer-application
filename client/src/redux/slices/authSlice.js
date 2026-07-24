import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem('token') || null;
    } catch {
        return null;
    }
};

const safeStoredUser = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const persistAuth = (token, user) => {
    if (typeof window === 'undefined') return;
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user || safeStoredUser()));
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

const normalizeErrorPayload = (err, fallbackMessage) => {
    const responseData = err?.response?.data;
    if (typeof responseData === 'string') {
        return { message: responseData };
    }
    if (responseData && typeof responseData === 'object') {
        return responseData;
    }

    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        return { message: 'Unable to reach the backend. Set VITE_API_URL to your Render backend URL.' };
    }

    return { message: fallbackMessage };
};

// Async thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/auth/login', credentials);
        if (data?.token) {
            persistAuth(data.token, data.user);
        }
        return data;
    } catch (err) {
        return rejectWithValue(normalizeErrorPayload(err, 'Login failed'));
    }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/auth/register', userData);
        if (data?.token) {
            persistAuth(data.token, data.user);
        } else {
            persistAuth(null, null);
        }
        return data;
    } catch (err) {
        return rejectWithValue(normalizeErrorPayload(err, 'Registration failed'));
    }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/auth/me');
        return data.user;
    } catch (err) {
        return rejectWithValue(normalizeErrorPayload(err, 'Session check failed'));
    }
});

export const verifyOtpCode = createAsyncThunk('auth/verifyOtpCode', async ({ email, otp }, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/auth/verify-email-otp', { email, otp });
        if (data?.token) {
            persistAuth(data.token, data.user);
        }
        return data;
    } catch (err) {
        return rejectWithValue(normalizeErrorPayload(err, 'OTP verification failed'));
    }
});

export const googleAuth = createAsyncThunk('auth/googleAuth', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/auth/google');
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Google auth failed');
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
    try { await API.post('/auth/logout'); } catch (e) { /* ignore */ }
    persistAuth(null, null);
});

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: safeStoredUser(),
        token: getStoredToken(),
        loading: false,
        error: null,
        isAuthenticated: !!getStoredToken(),
        verificationPendingEmail: null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        setUser: (state, action) => { state.user = action.payload; },
        setAuthSession: (state, action) => {
            const { token, user, isAuthenticated = !!token, verificationPendingEmail = null } = action.payload || {};
            state.user = user || null;
            state.token = token || null;
            state.isAuthenticated = isAuthenticated;
            state.verificationPendingEmail = verificationPendingEmail;
        },
    },
    extraReducers: (builder) => {
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => {
            state.loading = false;
            // payload can be a string or an object { message, requiresVerification, ... }
            const p = action.payload;
            state.error = typeof p === 'string' ? p : (p?.message || 'Something went wrong');
        };

        builder
            .addCase(loginUser.pending, pending)
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload?.user || null;
                state.token = action.payload?.token || null;
                state.isAuthenticated = !!action.payload?.token;
                state.error = null;
            })
            .addCase(loginUser.rejected, rejected)
            .addCase(registerUser.pending, pending)
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload?.user || null;
                state.token = action.payload?.token || null;
                state.isAuthenticated = !!action.payload?.token;
                state.verificationPendingEmail = action.payload?.requiresVerification
                    ? action.payload?.email || null
                    : null;
                state.error = null;
            })
            .addCase(registerUser.rejected, rejected)
            .addCase(verifyOtpCode.pending, pending)
            .addCase(verifyOtpCode.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload?.user || null;
                state.token = action.payload?.token || null;
                state.isAuthenticated = !!action.payload?.token;
                state.verificationPendingEmail = null;
                state.error = null;
            })
            .addCase(verifyOtpCode.rejected, rejected)
            .addCase(getMe.fulfilled, (state, action) => { state.user = action.payload; })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null; state.token = null; state.isAuthenticated = false;
            });
    },
});

export const { clearError, setUser, setAuthSession } = authSlice.actions;
export default authSlice.reducer;
