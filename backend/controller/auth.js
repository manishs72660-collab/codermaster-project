const validator = require("../utils/Validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/Userschema");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const Submission = require("../models/Submission");

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_COOKIE_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_COOKIE_MS = REFRESH_TTL_SECONDS * 1000;

// ---- helpers ---------------------------------------------------------

const normalizeEmail = (email) => email?.trim().toLowerCase();

// ---- token helpers ---------------------------------------------------

const generateAccessToken = (user) =>
  jwt.sign(
    { _id: user._id, emailId: user.emailId, role: user.role },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: "7d",
  });

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
});

// Issues a fresh access+refresh pair, stores the refresh token in Redis
// (keyed by user id) so refresh() can detect reuse/rotation, and sets
// both as httpOnly cookies.
const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await client.set(`refreshToken:${user._id}`, refreshToken, {
    EX: REFRESH_TTL_SECONDS,
  });

  res.cookie("accessToken", accessToken, cookieOptions(ACCESS_COOKIE_MS));
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_COOKIE_MS));
};

const publicUser = (user) => ({
  firstName: user.firstName,
  emailId: user.emailId,
  _id: user._id,
  role: user.role,
});

// ---- controllers -------------------------------------------------------

const register = async (req, res) => {
  try {
    await validator(req.body);
    const { password, firstName, lastName, age, profileImage } = req.body;
    const emailId = normalizeEmail(req.body.emailId);

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const userData = {
      firstName,
      emailId,
      password: await bcrypt.hash(password, 10),
      role: "User",
    };
    if (lastName) userData.lastName = lastName;
    if (age !== undefined) userData.age = age;
    if (profileImage !== undefined) userData.profileImage = profileImage;

    const user = await User.create(userData);
    await issueTokens(res, user);

    res.status(201).json({
      user: publicUser(user),
      message: "Registered successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const emailId = normalizeEmail(req.body.emailId);
    const { password } = req.body;
    if (!emailId || !password) {
      throw new Error("Invalid credentials");
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }

    await issueTokens(res, user);

    res.status(200).json({
      user: publicUser(user),
      message: "Logged in successfully",
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

// Google sign-in. NOTE: per current setup this trusts the profile data the
// frontend sends after the Firebase popup, without verifying the Firebase
// ID token server-side. That means this endpoint cannot cryptographically
// prove the request came from the account it claims - anyone can POST a
// fake emailId/firstName here and get a session for that email. Add
// firebase-admin verification later if that risk matters for you.
const googleAuth = async (req, res) => {
  try {
    const emailId = normalizeEmail(req.body.emailId);
    const { firstName, photoURL } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ emailId });
    if (!user) {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );
      user = await User.create({
        firstName: firstName || "User",
        emailId,
        password: randomPassword, // schema requires a password; Google users never use it to log in
        role: "User",
        ...(photoURL ? { profileImage: photoURL } : {}),
      });
    }

    await issueTokens(res, user);

    res.status(200).json({
      user: publicUser(user),
      message: "Google sign-in successful",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Exchanges a valid refresh cookie for a new access+refresh pair.
// Rotates the refresh token every call; if the presented refresh token
// doesn't match the one on record, the stored one is deleted, killing
// the session (handles theft/reuse).
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const stored = await client.get(`refreshToken:${payload._id}`);
    if (!stored || stored !== refreshToken) {
      await client.del(`refreshToken:${payload._id}`);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Session invalid, please log in again" });
    }

    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    await issueTokens(res, user); // rotation: overwrites Redis entry + sets new cookies

    res.status(200).json({ message: "Token refreshed" });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
};

const logout = async (req, res) => {
  try {
    const { accessToken } = req.cookies;

    if (accessToken) {
      const payload = jwt.decode(accessToken);
      if (payload?.exp) {
        await client.set(`token:${accessToken}`, "Blocked");
        await client.expireAt(`token:${accessToken}`, payload.exp);
      }
    }

    if (req.result?._id) {
      await client.del(`refreshToken:${req.result._id}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).send("Logout successful");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

const profile = async (req, res) => {
  try {
    res.status(200).send(req.result);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { _id } = req.result;
    await User.findByIdAndDelete(_id);
    await Submission.deleteMany({ userId: _id });
    await client.del(`refreshToken:${_id}`);
    res.status(200).send("User deleted successfully");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

// Only reachable via /auth/admin/register, which is already gated by
// adminmiddleware - so only an existing admin can create another admin.
const adminRegister = async (req, res) => {
  try {
    await validator(req.body);
    const { password, firstName, lastName, age, profileImage, role } = req.body;
    const emailId = normalizeEmail(req.body.emailId);

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const userData = {
      firstName,
      emailId,
      password: await bcrypt.hash(password, 10),
      role,
    };
    if (lastName) userData.lastName = lastName;
    if (age !== undefined) userData.age = age;
    if (profileImage !== undefined) userData.profileImage = profileImage;

    const user = await User.create(userData);
    await issueTokens(res, user);

    res.status(201).json({
      user: publicUser(user),
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  refresh,
  logout,
  profile,
  deleteUser,
  adminRegister,
};