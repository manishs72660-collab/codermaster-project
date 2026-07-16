const jwt = require("jsonwebtoken");
const User = require("../models/Userschema");
const client = require("../config/redis");

const userAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) {
      return res.status(401).json({ message: "Token doesn't exist" });
    }

    const isBlocked = await client.exists(`token:${accessToken}`);
    if (isBlocked) {
      return res.status(401).json({ message: "Invalid token" });
    }

    let payload;
    try {
      payload = jwt.verify(accessToken, process.env.JWT_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        // `code` lets the frontend axios interceptor know to call /auth/refresh
        return res
          .status(401)
          .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    const { _id } = payload;
    if (!_id) {
      return res.status(401).json({ message: "Id is missing" });
    }

    const result = await User.findById(_id);
    if (!result) {
      return res.status(401).json({ message: "User doesn't exist" });
    }

    req.result = result;
    next();
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
};

module.exports = userAuth;