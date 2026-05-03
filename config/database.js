/**
 * MongoDB Database Connection
 * Handles connection to MongoDB Atlas
 */

const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

/**
 * Connect to MongoDB Atlas with retry logic.
 * Timeouts are tuned for cross-region links (e.g. Render -> MongoDB Atlas in UAE)
 * where TLS handshake + latency can exceed default short timeouts on cold start.
 *
 * @returns {Promise} Mongoose connection promise
 */
async function connectDB() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
    };

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
    });

    connectionPromise = (async () => {
        const maxAttempts = 5;
        let attempt = 0;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                console.log(`Connecting to MongoDB (attempt ${attempt}/${maxAttempts})...`);
                await mongoose.connect(mongoURI, options);
                isConnected = true;
                console.log('MongoDB connected successfully');
                return;
            } catch (error) {
                console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
                if (attempt >= maxAttempts) {
                    isConnected = false;
                    connectionPromise = null;
                    throw error;
                }
                const delayMs = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
                console.log(`Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    })();

    try {
        await connectionPromise;
    } finally {
        if (!isConnected) {
            connectionPromise = null;
        }
    }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise}
 */
async function disconnectDB() {
    if (!isConnected) return;

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isDBConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
    connectDB,
    disconnectDB,
    isDBConnected
};
