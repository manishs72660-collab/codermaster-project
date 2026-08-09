const redisClient = require("../config/redis");

const windowSize = 3600; // 1 hour
const MaxRequest = 100;

const rateLimiter = async (req, res, next) => {
    try {
        const key = `IP:${req.ip}`;

        const currentTime = Math.floor(Date.now() / 1000);
        const windowStart = currentTime - windowSize;

        // Remove old requests
        await redisClient.zRemRangeByScore(key, 0, windowStart);

        // Count requests in current window
        const numberOfRequest = await redisClient.zCard(key);
        // Check limit
        if (numberOfRequest >= MaxRequest) {
            return res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later."
            });
        }

        // Store current request
        await redisClient.zAdd(key, [
            {
                score: currentTime,
                value: `${currentTime}:${Math.random()}`
            }
        ]);

        // Set expiry
        await redisClient.expire(key, windowSize);

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = rateLimiter;