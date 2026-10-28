const fs = require("fs");
const path = require("path");
const redisClient = require("../config/redis");

const rateLimiterLua = fs.readFileSync(path.join(__dirname, "rateLimiter.lua"), "utf8");

const windowSize = 3600; // 1 hour
const MaxRequest = 100;

// 🔥 Load test ke time bypass karo (sirf localhost se)
const isLocalRequest = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const rateLimiter = async (req, res, next) => {
  try {
    // 🔥 Agar env me SKIP_RATE_LIMIT=true hai aur localhost se hai, toh bypass
    if (process.env.SKIP_RATE_LIMIT === 'true' && isLocalRequest(req.ip)) {
      return next();
    }

    const key = `IP:${req.ip}`;
    const currentTime = Math.floor(Date.now() / 1000);
    const uniqueId = `${currentTime}:${Math.random()}`;

    const isAllowed = await redisClient.eval(rateLimiterLua, {
      keys: [key],
      arguments: [
        currentTime.toString(),
        windowSize.toString(),
        MaxRequest.toString(),
        uniqueId,
      ],
    });

    if (isAllowed === 0) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (err) {
    console.error("Rate Limiter Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = rateLimiter;