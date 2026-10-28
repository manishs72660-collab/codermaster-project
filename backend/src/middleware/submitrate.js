const client = require("../config/redis");

// 🔥 Load test bypass
const isLocalRequest = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const submitCodeRateLimiter = async (req, res, next) => {
  if (process.env.SKIP_RATE_LIMIT === 'true' && isLocalRequest(req.ip)) {
    return next();
  }

  const userId = req.result._id;
  const redisKey = `submit_cooldown:${userId}`;

  try {
    const isSet = await client.set(redisKey, "cooldown_active", {
      EX: 10,
      NX: true,
    });

    if (!isSet) {
      return res.status(429).json({
        error: "Please wait 10 seconds before submitting again",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = submitCodeRateLimiter;