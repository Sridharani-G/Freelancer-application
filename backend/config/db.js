require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const dns = require('dns');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let connectionAttemptPromise = null;
let memoryServerInstance = null;

const publicDnsServers = ['8.8.8.8', '1.1.1.1'];
try {
    dns.setServers(publicDnsServers);
} catch (error) {
    console.warn('⚠️ Could not override DNS servers for MongoDB SRV resolution:', error?.message || error);
}

mongoose.set('bufferCommands', false);

const isDbReady = () => mongoose.connection.readyState === 1;

const isTransientMongoError = (message = '') => /ENOTFOUND|ECONNREFUSED|ECONNRESET|querySrv|no reachable|ENETUNREACH|EAI_AGAIN|serverSelection|socket hang up/i.test(message);

const getMemoryServerUri = async () => {
    if (memoryServerInstance) {
        return memoryServerInstance.getUri();
    }

    memoryServerInstance = await MongoMemoryServer.create({
        instance: { dbName: 'skillsphere' },
        binary: { version: '7.0.14' },
    });

    return memoryServerInstance.getUri();
};

const connectWithUrl = async (url, label) => {
    console.log(`Attempting to connect to MongoDB via ${label}: ${url}`);

    const conn = await mongoose.connect(url, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
    });

    console.log(`✅ MongoDB Connected via ${label}: ${conn.connection.host}`);
    return { connected: true, url, uri: url };
};

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return { connected: true, url: mongoose.connection.uri, uri: mongoose.connection.uri };
    }

    if (connectionAttemptPromise) {
        return connectionAttemptPromise;
    }

    connectionAttemptPromise = (async () => {
        const configuredUrl = (process.env.MONGO_URL || '').trim();

        if (!configuredUrl) {
            console.warn('⚠️ MONGO_URL is not set. Starting an in-memory MongoDB instance for local development.');
            const fallbackUrl = await getMemoryServerUri();
            return await connectWithUrl(fallbackUrl, 'in-memory MongoDB');
        }

        try {
            return await connectWithUrl(configuredUrl, 'configured URL');
        } catch (error) {
            const message = error?.message || 'Unknown MongoDB error';
            console.warn(`⚠️ MongoDB attempt failed for configured URL: ${message}`);

            if (isTransientMongoError(message)) {
                console.warn('⚠️ Atlas connection unreachable. Falling back to in-memory MongoDB for development.');
                try {
                    const fallbackUrl = await getMemoryServerUri();
                    return await connectWithUrl(fallbackUrl, 'in-memory MongoDB');
                } catch (fallbackError) {
                    console.error('❌ In-memory MongoDB fallback also failed:', fallbackError?.message || fallbackError);
                    return { connected: false, url: configuredUrl, uri: configuredUrl };
                }
            }

            return { connected: false, url: configuredUrl, uri: configuredUrl };
        }
    })();

    try {
        return await connectionAttemptPromise;
    } finally {
        connectionAttemptPromise = null;
    }
};

const requireDbConnection = async () => {
    if (isDbReady()) {
        return true;
    }

    const dbState = await connectDB();
    if (!dbState?.connected) {
        const error = new Error('Database is currently unavailable.');
        error.statusCode = 503;
        throw error;
    }

    return true;
};

module.exports = connectDB;
module.exports.isDbReady = isDbReady;
module.exports.requireDbConnection = requireDbConnection;
