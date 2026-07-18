const College = require("../models/collagescheam");
const User = require("../models/Userschema");
const Submission = require("../models/Submission");
const client = require("../config/redis");
const { createAccount, issueTokens, publicUser, normalizeEmail } = require("./auth");

// ---- college lifecycle ---------------------------------------------------

// Public signup endpoint: creates the College doc AND its first
// CollageAdmin user in one call, using the same createAccount() helper
// that auth.js's register()/adminRegister() use. On success the admin is
// immediately logged in (cookies set), same as a normal register call.
const registerCollege = async (req, res) => {
  const {
    Collage_name,
    collegeCode,
    adminFirstName,
    adminLastName,
    adminEmail,
    adminPassword,
  } = req.body;

  if (!Collage_name || !collegeCode || !adminFirstName || !adminEmail || !adminPassword) {
    return res.status(400).json({
      success: false,
      message: "Collage_name, collegeCode, adminFirstName, adminEmail and adminPassword are all required",
    });
  }

  // Catches the classic "sent as a JSON number/boolean instead of a
  // quoted string" mistake before it reaches bcrypt and throws a cryptic
  // "data must be a string or Buffer" error.
  if (typeof adminPassword !== "string" || typeof adminEmail !== "string") {
    return res.status(400).json({
      success: false,
      message: "adminPassword and adminEmail must be strings",
    });
  }
  if (adminPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "adminPassword must be at least 6 characters long",
    });
  }

  const normalizedAdminEmail = normalizeEmail(adminEmail);
  const normalizedCode = String(collegeCode).trim().toUpperCase();

  const existingCollege = await College.findOne({
    $or: [{ collegeCode: normalizedCode }, { adminEmail: normalizedAdminEmail }],
  });
  if (existingCollege) {
    return res.status(409).json({
      success: false,
      message: "College code or admin email is already in use",
    });
  }

  let college;
  try {
    college = await College.create({
      Collage_name,
      collegeCode: normalizedCode,
      adminEmail: normalizedAdminEmail,
    });

    // Same account-creation path as a normal user registering, just with
    // role "CollageAdmin" and this college's id attached.
    const adminUser = await createAccount({
      firstName: adminFirstName,
      lastName: adminLastName,
      emailId: normalizedAdminEmail,
      password: adminPassword,
      role: "CollageAdmin",
      collegeId: college._id,
    });

    college.adminId = adminUser._id;
    await college.save();

    await issueTokens(res, adminUser);

    return res.status(201).json({
      success: true,
      message: "College registered successfully",
      college: {
        _id: college._id,
        Collage_name: college.Collage_name,
        collegeCode: college.collegeCode,
        adminEmail: college.adminEmail,
        plan: college.plan,
      },
      admin: publicUser(adminUser),
    });
  } catch (err) {
    // createAccount() throws (409) if the email is taken elsewhere as a
    // non-college-admin user - in that edge case, undo the College doc so
    // we don't leave an orphaned college with no admin.
    if (college?._id && !college.adminId) {
      await College.findByIdAndDelete(college._id);
    }
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

// Platform-admin only.
const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().select("-__v");
    res.status(200).json({ success: true, colleges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }
    res.status(200).json({ success: true, college });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    // Whitelist: don't let arbitrary body fields overwrite collegeCode/adminEmail/adminId.
    const allowedUpdates = ["Collage_name", "plan", "isActive"];
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const college = await College.findByIdAndUpdate(collegeId, updates, {
      new: true,
      runValidators: true,
    });
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }
    res.status(200).json({ success: true, college });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Platform-admin only. Cascades: every user in the college, their
// submissions, and their refresh tokens, then the college itself.
const deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    const users = await User.find({ collegeId }).select("_id");
    const userIds = users.map((u) => u._id);

    await Submission.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ collegeId });
    await Promise.all(userIds.map((id) => client.del(`refreshToken:${id}`)));
    await College.findByIdAndDelete(collegeId);

    res.status(200).json({ success: true, message: "College and all its members deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---- students within a college ------------------------------------------

// GET /college/:collegeId/students - paginated list of students (role
// "User") belonging to :collegeId. Route is expected to sit behind
// collegeScope middleware, which already confirmed the caller may see
// this collegeId.
const getCollegeStudents = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const filter = { collegeId, role: "User" };
    const [students, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      students,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      totalStudents: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /college/:collegeId/students/:userId - fetch one student, but only
// if they actually belong to :collegeId. This is the tenant-isolation
// check: a college admin can't fetch another college's student just by
// guessing a userId.
const getCollegeStudentById = async (req, res) => {
  try {
    const { collegeId, userId } = req.params;
    const student = await User.findOne({ _id: userId, collegeId }).select("-password");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this college" });
    }
    res.status(200).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCollegeStudent = async (req, res) => {
  try {
    const { collegeId, userId } = req.params;
    const student = await User.findOneAndDelete({ _id: userId, collegeId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this college" });
    }
    await Submission.deleteMany({ userId });
    await client.del(`refreshToken:${userId}`);
    res.status(200).json({ success: true, message: "Student removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getCollegeStudents,
  getCollegeStudentById,
  deleteCollegeStudent,
};