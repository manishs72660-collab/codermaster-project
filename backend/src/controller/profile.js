const mongoose = require("mongoose");
const User = require("../models/Userschema");
const userProblem = require("../models/Userdetail");
const Submission = require("../models/Submission");

// GET /profile/:userId  -> everything needed for header + stat cards
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId)
      .select("firstName lastName profileImage createdAt")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const userObjectId = user._id;

    // Phase 1: independent queries in parallel
    const [difficultyAgg, streakDates, totalSubmissions, acceptedSubmissions] =
      await Promise.all([
        userProblem.aggregate([
          { $match: { userId: userObjectId, status: "accepted" } },
          { $group: { _id: "$problemId", difficulty: { $first: "$difficulty" } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              easy: { $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] } },
              medium: { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
              hard: { $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] } },
            },
          },
        ]),
        userProblem.aggregate([
          { $match: { userId: userObjectId, status: "accepted" } },
          { $project: { solvedDate: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
          { $group: { _id: "$solvedDate" } },
          { $sort: { _id: -1 } },
        ]),
        Submission.countDocuments({ userId: userObjectId }),
        Submission.countDocuments({ userId: userObjectId, status: "accepted" }),
      ]);

    const stats = difficultyAgg[0] || { total: 0, easy: 0, medium: 0, hard: 0 };

    // Phase 2: rank depends on total from phase 1
    const higherRanked = await userProblem.aggregate([
      { $match: { status: "accepted" } },
      { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
      { $group: { _id: "$_id.userId", solvedCount: { $sum: 1 } } },
      { $match: { solvedCount: { $gt: stats.total } } },
      { $count: "count" },
    ]);
    const rank = (higherRanked[0]?.count || 0) + 1;

    // streak calc
    let currentStreak = 0;
    if (streakDates.length) {
      let expected = new Date();
      expected.setUTCHours(0, 0, 0, 0);
      for (const item of streakDates) {
        const solvedDate = new Date(item._id + "T00:00:00.000Z");
        if (solvedDate.getTime() === expected.getTime()) {
          currentStreak++;
          expected.setUTCDate(expected.getUTCDate() - 1);
        } else if (solvedDate.getTime() > expected.getTime()) {
          continue;
        } else break;
      }
    }

    const acceptanceRate =
      totalSubmissions > 0
        ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(1))
        : 0;

    return res.status(200).json({
      userId: user._id,
      username: user.firstName,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      avatar: user.profileImage || null,
      bio: user.profile?.bio || "",
      location: user.profile?.location || "",
      socialLinks: user.profile?.socialLinks || {},
      joinedAt: user.createdAt,
      stats: {
        total: stats.total,
        easy: stats.easy,
        medium: stats.medium,
        hard: stats.hard,
        rank,
        currentStreak,
        acceptanceRate,
        totalSubmissions,
      },
    });
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// GET /profile/:userId/heatmap?year=2026
const getHeatmap = async (req, res) => {
  try {
    const { userId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const data = await Submission.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const heatmap = {};
    data.forEach((d) => (heatmap[d._id] = d.count));

    res.status(200).json({ year, heatmap });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// GET /profile/:userId/submissions?page=1&limit=10&status=accepted
const getRecentSubmissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const filter = { userId };
    if (status) filter.status = status;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .select("problemId status language runtime memory createdAt")
        .populate("problemId", "title difficulty tags") // pulls these fields from Problem
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    // reshape so frontend gets a clean "problemTitle" field
    const formatted = submissions.map((s) => ({
      _id: s._id,
      problemTitle: s.problemId?.title || "Unknown problem",
      problemId: s.problemId?._id,
      difficulty: s.problemId?.difficulty,
      status: s.status,
      language: s.language,
      runtime: s.runtime,
      memory: s.memory,
      createdAt: s.createdAt,
    }));

    res.status(200).json({
      submissions: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// GET /profile/:userId/skills  -> topic-wise breakdown
const getSkillsBreakdown = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const skills = await userProblem.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: "accepted" } },
      {
        $lookup: {
          from: "problems", // <-- confirm this matches your actual Problem collection name
          localField: "problemId",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      { $unwind: "$problem.tags" }, // <-- assumes Problem has a `tags: [String]` field
      { $group: { _id: "$problem.tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);

    res.status(200).json({ skills });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

// PUT /profile  (auth required, edits own profile only)
const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const { bio, location, avatar, socialLinks } = req.body;

    const update = {};
    if (bio !== undefined) update["profile.bio"] = bio;
    if (location !== undefined) update["profile.location"] = location;
    if (avatar !== undefined) update["profile.avatar"] = avatar;
    if (socialLinks?.github !== undefined) update["profile.socialLinks.github"] = socialLinks.github;
    if (socialLinks?.linkedin !== undefined) update["profile.socialLinks.linkedin"] = socialLinks.linkedin;
    if (socialLinks?.website !== undefined) update["profile.socialLinks.website"] = socialLinks.website;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select("username profile")
      .lean();

    res.status(200).json({ message: "Profile updated", profile: updatedUser.profile });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports = {
  getUserProfile,
  getHeatmap,
  getRecentSubmissions,
  getSkillsBreakdown,
  updateProfile,
};