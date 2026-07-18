const validator = require("../utils/Validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/Userschema");
const College = require("../models/collagescheam");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const Submission = require("../models/Submission");

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_COOKIE_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_COOKIE_MS = REFRESH_TTL_SECONDS * 1000;

// ---- helpers ---------------------------------------------------------

const normalizeEmail = (email) => email?.trim().toLowerCase();

// ---- token helpers -----------------------------------------------------

// collegeId is only included when the user actually has one (platform
// "Admin" accounts don't), so downstream code should treat it as optional.
const generateAccessToken = (user) =>
  jwt.sign(
    {
      _id: user._id,
      emailId: user.emailId,
      role: user.role,
      ...(user.collegeId ? { collegeId: user.collegeId } : {}),
    },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      _id: user._id,
      ...(user.collegeId ? { collegeId: user.collegeId } : {}),
    },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: "7d" }
  );

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
});

// Issues a fresh access+refresh pair, stores the refresh token in Redis
// (keyed by user id) so refresh() can detect reuse/rotation, and sets
// both as httpOnly cookies. Because refresh() re-fetches the user from
// Mongo before calling this, collegeId in the tokens always reflects the
// current DB state - it's recomputed on every refresh, not just at login.
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
  collegeId: user.collegeId,
});

// ---- shared account-creation logic --------------------------------------
//
// Core "create a User document" logic, pulled out of the old register()
// so it can be reused by:
//   - register()        -> role "User", collegeId optional
//   - adminRegister()    -> role "Admin", no collegeId
//   - college.js's registerCollege() -> role "CollageAdmin", collegeId required
//
// This does NOT touch req/res or cookies - callers decide what to do with
// the returned user (e.g. issueTokens + respond, or just create-and-return).
const createAccount = async ({
  firstName,
  lastName,
  emailId,
  password,
  age,
  profileImage,
  role = "User",
  collegeId,
}) => {
  const normalizedEmail = normalizeEmail(emailId);

  const existingUser = await User.findOne({ emailId: normalizedEmail });
  if (existingUser) {
    const err = new Error("Email is already registered");
    err.statusCode = 409;
    throw err;
  }

  const userData = {
    firstName,
    emailId: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role,
  };
  if (lastName) userData.lastName = lastName;
  if (age !== undefined) userData.age = age;
  if (profileImage !== undefined) userData.profileImage = profileImage;
  if (collegeId) userData.collegeId = collegeId;

  return User.create(userData);
};

// ---- controllers -------------------------------------------------------

const register = async (req, res) => {
  try {
    await validator(req.body);
    const { password, firstName, lastName, age, profileImage, collegeCode } = req.body;
    const emailId = normalizeEmail(req.body.emailId);

    // A student registering directly (not via a college-admin invite flow)
    // can optionally join a college at signup time using its human-readable
    // code (e.g. "EXU01") - the one shown to the college admin after
    // registerCollege(), not the raw Mongo _id. Looking it up here means
    // the frontend never has to know or handle ObjectId format at all.
    let collegeId;
    if (collegeCode) {
      const college = await College.findOne({
        collegeCode: String(collegeCode).trim().toUpperCase(),
      });
      if (!college || !college.isActive) {
        return res.status(400).json({ message: "Invalid or inactive college code" });
      }
      collegeId = college._id;
    }

    const user = await createAccount({
      firstName,
      lastName,
      emailId,
      password,
      age,
      profileImage,
      role: "User",
      collegeId,
    });
    await issueTokens(res, user);

    res.status(201).json({
      user: publicUser(user),
      message: "Registered successfully",
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
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
    const { firstName, photoURL, collegeId } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ emailId });
    if (!user) {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );
      const userData = {
        firstName: firstName || "User",
        emailId,
        password: randomPassword, // schema requires a password; Google users never use it to log in
        role: "User",
        ...(photoURL ? { profileImage: photoURL } : {}),
      };
      if (collegeId) userData.collegeId = collegeId;
      user = await User.create(userData);
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

    // Re-issuing from the fresh `user` doc (not the old payload) means
    // collegeId in the new tokens always reflects current DB state.
    await issueTokens(res, user);

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
// adminmiddleware - so only an existing platform Admin can create another
// platform Admin. (College admins are created through
// college.js -> registerCollege(), not through this endpoint.)
const adminRegister = async (req, res) => {
  try {
    await validator(req.body);
    const { password, firstName, lastName, age, profileImage, role } = req.body;
    const emailId = normalizeEmail(req.body.emailId);

    const user = await createAccount({
      firstName,
      lastName,
      emailId,
      password,
      age,
      profileImage,
      role,
    });
    await issueTokens(res, user);

    res.status(201).json({
      user: publicUser(user),
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// One-time bootstrap: creates the very first platform Admin over HTTP.
// Self-locking - refuses to run once any Admin already exists, so it
// can't be used to mint extra admins later even if left wired up.
// Route it behind a setup secret (see routes) for defense in depth, but
// the "no Admin exists yet" check is what actually makes this safe.
const bootstrapAdmin = async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      return res.status(403).json({ message: "An admin already exists - use /auth/admin/register instead" });
    }

    await validator(req.body);
    const { password, firstName, lastName, age, profileImage } = req.body;
    const emailId = normalizeEmail(req.body.emailId);

    const user = await createAccount({
      firstName,
      lastName,
      emailId,
      password,
      age,
      profileImage,
      role: "Admin",
    });
    await issueTokens(res, user);

    res.status(201).json({
      user: publicUser(user),
      message: "First admin created",
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
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
  bootstrapAdmin,
  // exported for reuse outside this file (currently: college.js's
  // registerCollege, to create the CollageAdmin account)
  createAccount,
  issueTokens,
  publicUser,
  normalizeEmail,
};