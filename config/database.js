/**
 * MongoDB Database Connection
 * Handles connection to MongoDB Atlas
 */

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB Atlas
 * @returns {Promise} Mongoose connection promise
 */
async function connectDB() {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(mongoURI, options);
        isConnected = true;

        console.log('MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        isConnected = false;
        throw error;
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
