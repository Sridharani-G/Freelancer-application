// Global error handler
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        message = `Resource not found with id: ${err.value}`;
        statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map((e) => e.message).join(', ');
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token.';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Token expired.';
        statusCode = 401;
    }

    // Payload / request size errors
    if (err.type === 'entity.too.large' || err.type === 'payload.too.large' || err.code === 'LIMIT_FILE_SIZE') {
        message = 'Request payload is too large. Please reduce the media size and try again.';
        statusCode = 413;
    }

    // Mongo / DB availability errors
    if (err.name === 'MongoServerSelectionError' || err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError' || err.code === 'ECONNREFUSED' || err.statusCode === 503) {
        message = 'Database is currently unavailable. Please try again later.';
        statusCode = 503;
    }

    // Network / upstream connection errors -> Bad Gateway
    if (['EHOSTUNREACH', 'ECONNRESET', 'ENOTFOUND', 'ECONNABORTED'].includes(err.code) || err.syscall === 'connect') {
        message = 'Upstream service unavailable (502 Bad Gateway). Please try again later.';
        statusCode = 502;
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
