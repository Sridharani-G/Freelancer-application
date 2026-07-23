import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchJobs = createAsyncThunk('jobs/fetch', async (params, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/jobs', { params });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message);
    }
});

export const fetchJob = createAsyncThunk('jobs/fetchOne', async (id, { rejectWithValue }) => {
    try {
        const { data } = await API.get(`/jobs/${id}`);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message);
    }
});

export const createJob = createAsyncThunk('jobs/create', async (jobData, { rejectWithValue }) => {
    try {
        const { data } = await API.post('/jobs', jobData);
        return data.job;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message);
    }
});

export const fetchMyJobs = createAsyncThunk('jobs/fetchMine', async (_, { rejectWithValue }) => {
    try {
        const { data } = await API.get('/jobs/my-jobs');
        return data.jobs;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message);
    }
});

const jobsSlice = createSlice({
    name: 'jobs',
    initialState: {
        jobs: [], total: 0, pages: 1, page: 1,
        currentJob: null, myJobs: [],
        loading: false, error: null,
    },
    reducers: {
        clearCurrentJob: (state) => { state.currentJob = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchJobs.pending, (state) => { state.loading = true; })
            .addCase(fetchJobs.fulfilled, (state, action) => {
                state.loading = false;
                state.jobs = action.payload.jobs;
                state.total = action.payload.total;
                state.pages = action.payload.pages;
                state.page = action.payload.page;
            })
            .addCase(fetchJobs.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(fetchJob.pending, (state) => { state.loading = true; })
            .addCase(fetchJob.fulfilled, (state, action) => { state.loading = false; state.currentJob = action.payload; })
            .addCase(fetchJob.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createJob.fulfilled, (state, action) => { state.myJobs.unshift(action.payload); })
            .addCase(fetchMyJobs.fulfilled, (state, action) => { state.myJobs = action.payload; });
    },
});

export const { clearCurrentJob } = jobsSlice.actions;
export default jobsSlice.reducer;
