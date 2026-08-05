const express = require("express");
const profileRouter = express.Router();
const userAuth = require("../middleware/userauth");
const {
  getUserProfile,
  getHeatmap,
  getRecentSubmissions,
  getSkillsBreakdown,
  updateProfile,
} = require("../controller/profile");

// public — anyone can view a profile
profileRouter.get("/:userId", getUserProfile);
profileRouter.get("/:userId/heatmap", getHeatmap);
profileRouter.get("/:userId/submissions", getRecentSubmissions);
profileRouter.get("/:userId/skills", getSkillsBreakdown);

// private — only the logged-in user can edit their own profile
profileRouter.put("/", userAuth, updateProfile);

module.exports = profileRouter;