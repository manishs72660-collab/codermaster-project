const College = require("../models/collagescheam");
const User = require("../models/Userschema");
const Submission = require("../models/Submission");
const userProblem = require("../models/Userdetail"); // same model getUserProfile uses for solved-count aggregation
const client = require("../config/redis");
const { createAccount, publicUser, normalizeEmail } = require("./auth");
const bcrypt = require("bcrypt");
// ^ If your project uses "bcryptjs" instead of "bcrypt", change the
//   require above to: const bcrypt = require("bcryptjs");
//   Check your User model's pre-save hook / auth.js to confirm which one
//   is used for hashing signup passwords, and match it here so resend's
//   password hash is compatible with your login comparison.
const crypto = require("crypto");
const CollegeRequest = require("../models/collegeRequest");
const {
  sendCollegeRequestNotification,
  sendCollegeApprovedEmail,
  sendCollegeRejectedEmail,
} = require("../utils/mailer");

// ---- college lifecycle ---------------------------------------------------

// Validates input, creates the College doc + its first CollageAdmin user,
// and links them together. Does NOT touch cookies/tokens.
const createCollegeWithAdmin = async ({
  Collage_name,
  collegeCode,
  adminFirstName,
  adminLastName,
  adminEmail,
  adminPassword,
}) => {
  if (!Collage_name || !collegeCode || !adminFirstName || !adminEmail || !adminPassword) {
    const err = new Error(
      "Collage_name, collegeCode, adminFirstName, adminEmail and adminPassword are all required"
    );
    err.statusCode = 400;
    throw err;
  }

  if (typeof adminPassword !== "string" || typeof adminEmail !== "string") {
    const err = new Error("adminPassword and adminEmail must be strings");
    err.statusCode = 400;
    throw err;
  }
  if (adminPassword.length < 6) {
    const err = new Error("adminPassword must be at least 6 characters long");
    err.statusCode = 400;
    throw err;
  }

  const normalizedAdminEmail = normalizeEmail(adminEmail);
  const normalizedCode = String(collegeCode).trim().toUpperCase();

  const existingCollege = await College.findOne({
    $or: [{ collegeCode: normalizedCode }, { adminEmail: normalizedAdminEmail }],
  });
  if (existingCollege) {
    const err = new Error("College code or admin email is already in use");
    err.statusCode = 409;
    throw err;
  }

  let college;
  try {
    college = await College.create({
      Collage_name,
      collegeCode: normalizedCode,
      adminEmail: normalizedAdminEmail,
    });

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

    return { college, adminUser };
  } catch (err) {
    if (college?._id && !college.adminId) {
      await College.findByIdAndDelete(college._id);
    }
    throw err;
  }
};

// Platform-admin only. Does NOT log the caller in as the new admin - the
// caller stays logged in as themselves. Used by the "Register College"
// form on the platform admin dashboard.
const adminCreateCollege = async (req, res) => {
  try {
    const { college, adminUser } = await createCollegeWithAdmin(req.body);

    return res.status(201).json({
      success: true,
      message: "College created successfully",
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
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

// Platform-admin only. Populates adminId so the "all colleges" dashboard
// can show admin name/email without a second round trip per row.
const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find()
      .select("-__v")
      .populate("adminId", "firstName lastName emailId role")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, colleges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Platform admin (or that college's own admin, via collegeScope) can edit
// name/plan/active-status. The ManageColleges edit modal sends all three;
// the College Admin Dashboard doesn't call this at all right now.
const updateCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
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

// GET /collage/:collegeId/students - paginated name/email list, what the
// simplified College Admin Dashboard renders.
const getCollegeStudents = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = (req.query.search || "").trim();

    const filter = { collegeId, role: "User" };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { emailId: { $regex: search, $options: "i" } },
      ];
    }

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

// PATCH /collage/:collegeId/students/:userId/make-admin - promotes a
// student ("User") in this college to "CollageAdmin". Any number of
// CollageAdmins can exist per college - authorization (collegeScope) only
// checks role + collegeId, it never looks at College.adminId, so this
// doesn't require a schema change. NOTE: College.adminId still only
// points at whoever registered the college first, so ManageColleges'
// "Admin" column on the platform-admin side will keep showing that
// original admin, not every co-admin - cosmetic only, doesn't affect
// permissions.
const makeStudentCollegeAdmin = async (req, res) => {
  try {
    const { collegeId, userId } = req.params;
    const student = await User.findOne({ _id: userId, collegeId, role: "User" });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this college" });
    }

    student.role = "CollageAdmin";
    await student.save();

    res.status(200).json({
      success: true,
      message: `${student.firstName} is now a College Admin`,
      user: publicUser(student),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /collage/:collegeId/leaderboard
// Ranks every member of a single college (students + any co-admins) by
// TOTAL PROBLEMS SOLVED (accepted submissions), ties broken by who joined
// earlier. Access is enforced upstream by collegeMemberScope: platform
// Admin can view any college's board; everyone else can only view their
// own college's board (via req.result.collegeId matching :collegeId) - a
// student or admin from College A can never pull College B's leaderboard.
//
// Reputation is no longer used here - it's an unused/always-zero field on
// the User schema in this codebase (nothing increments it), so sorting by
// it was effectively meaningless. totalSolved is computed the same way
// getUserProfile() does: distinct (userId, problemId) pairs from the
// Userdetail collection where status === "accepted".
//
// NOTE: because the sort key (totalSolved) is computed, not stored, we
// can't sort+paginate at the DB level like before - we pull every matching
// user in the college, rank them all in memory, then slice the requested
// page out of that ranked list.
const getCollegeLeaderboard = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const filter = { collegeId, role: { $in: ["User", "CollageAdmin"] } };

    const [allStudents, college] = await Promise.all([
      User.find(filter)
        .select("firstName lastName profileImage role createdAt")
        .lean(),
      College.findById(collegeId).select("Collage_name collegeCode"),
    ]);

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    const total = allStudents.length;
    const studentIds = allStudents.map((u) => u._id);

    const solvedAgg = studentIds.length
      ? await userProblem.aggregate([
          { $match: { userId: { $in: studentIds }, status: "accepted" } },
          // distinct (userId, problemId) first, same as getUserProfile,
          // so re-submitting an already-solved problem doesn't inflate the count
          { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
          { $group: { _id: "$_id.userId", solvedCount: { $sum: 1 } } },
        ])
      : [];
    const solvedMap = new Map(solvedAgg.map((s) => [String(s._id), s.solvedCount]));

    const ranked = allStudents
      .map((u) => ({
        userId: u._id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        profileImage: u.profileImage,
        totalSolved: solvedMap.get(String(u._id)) || 0,
        role: u.role,
        createdAt: u.createdAt,
      }))
      .sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        return new Date(a.createdAt) - new Date(b.createdAt); // earlier join wins ties
      });

    const startIdx = (page - 1) * limit;
    const leaderboard = ranked.slice(startIdx, startIdx + limit).map((entry, idx) => ({
      rank: startIdx + idx + 1,
      userId: entry.userId,
      name: entry.name,
      profileImage: entry.profileImage,
      totalSolved: entry.totalSolved,
      role: entry.role,
    }));

    res.status(200).json({
      success: true,
      college: { name: college.Collage_name, code: college.collegeCode },
      leaderboard,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      totalStudents: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---- college registration requests (public → admin review) --------------

// PUBLIC — no auth. This is what the Signup page's "Register your college"
// popup calls. Just saves the request + notifies the platform admin by
// email. Does NOT create the college or account yet.
const requestCollege = async (req, res) => {
  try {
    const { Collage_name, collegeCode, adminFirstName, adminLastName, adminEmail, message } = req.body;

    if (!Collage_name || !collegeCode || !adminFirstName || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Collage_name, collegeCode, adminFirstName and adminEmail are required",
      });
    }

    const normalizedEmail = normalizeEmail(adminEmail);
    const normalizedCode = String(collegeCode).trim().toUpperCase();

    const alreadyExists = await College.findOne({
      $or: [{ collegeCode: normalizedCode }, { adminEmail: normalizedEmail }],
    });
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "A college with this code or admin email is already registered",
      });
    }

    const request = await CollegeRequest.create({
      Collage_name,
      collegeCode: normalizedCode,
      adminFirstName,
      adminLastName,
      adminEmail: normalizedEmail,
      message,
    });

    sendCollegeRequestNotification(request).catch((err) =>
      console.error("Failed to send request notification email:", err)
    );

    res.status(201).json({
      success: true,
      message: "Request received — we'll email you once it's reviewed.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Platform-admin only. Lists requests, optionally filtered by ?status=pending
const getCollegeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await CollegeRequest.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shared helper: sends the approval email, AWAITS the result (no more
// fire-and-forget), and persists whether it actually succeeded so the
// admin dashboard can show real status and offer a resend.
const sendApprovalEmailAndRecordStatus = async (request, college, tempPassword) => {
  request.emailAttempts = (request.emailAttempts || 0) + 1;
  request.lastEmailAttemptAt = new Date();
  try {
    await sendCollegeApprovedEmail({
      toEmail: request.adminEmail,
      collegeName: college.Collage_name,
      collegeCode: college.collegeCode,
      tempPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    });
    request.emailStatus = "sent";
    request.emailError = null;
  } catch (err) {
    console.error("Failed to send approval email:", err);
    request.emailStatus = "failed";
    request.emailError = err.message || "Unknown error";
  }
  await request.save();
};

// Platform-admin only. Creates the college + admin account for real (reuses
// the exact same helper the direct "Register College" admin form uses),
// generates a temp password, and emails the requester their login.
//
// CHANGED: the email send is now awaited and its outcome persisted on the
// request (emailStatus/emailError) instead of being fire-and-forget with
// only a console.error. The API response also now includes emailStatus so
// the frontend can tell the platform admin the truth instead of always
// claiming "confirmation email sent".
const approveCollegeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await CollegeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");

    const { college } = await createCollegeWithAdmin({
      Collage_name: request.Collage_name,
      collegeCode: request.collegeCode,
      adminFirstName: request.adminFirstName,
      adminLastName: request.adminLastName,
      adminEmail: request.adminEmail,
      adminPassword: tempPassword,
    });

    request.status = "approved";
    request.reviewedBy = req.result?._id; // adjust to whatever field your usermiddleware sets (e.g. req.user)
    request.reviewedAt = new Date();
    await request.save();

    await sendApprovalEmailAndRecordStatus(request, college, tempPassword);

    res.status(200).json({
      success: true,
      message:
        request.emailStatus === "sent"
          ? "College approved and registered"
          : "College approved and registered, but the confirmation email failed to send. You can resend it from this page.",
      college,
      emailStatus: request.emailStatus,
      emailError: request.emailError,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// Platform-admin only. Re-sends the approval email for a request whose
// college/admin account already exists (e.g. emailStatus === "failed").
// Does NOT recreate the college. Generates a FRESH temp password and
// updates the admin account's password directly with bcrypt, rather than
// storing/reusing the original one - avoids keeping a recoverable
// plaintext password anywhere in the CollegeRequest collection.
const resendApprovalEmail = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await CollegeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Can only resend the email for an already-approved request",
      });
    }

    const college = await College.findOne({ collegeCode: request.collegeCode }).populate("adminId");
    if (!college || !college.adminId) {
      return res.status(404).json({ success: false, message: "College or admin account not found" });
    }

    const newTempPassword = crypto.randomBytes(6).toString("hex");
    // Matches createAccount()'s hashing in auth.js: bcrypt.hash(password, 10)
    college.adminId.password = await bcrypt.hash(newTempPassword, 10);
    await college.adminId.save();

    await sendApprovalEmailAndRecordStatus(request, college, newTempPassword);

    res.status(200).json({
      success: true,
      message:
        request.emailStatus === "sent"
          ? "Email resent with a new password"
          : "Resend failed again - see emailError",
      emailStatus: request.emailStatus,
      emailError: request.emailError,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Platform-admin only.
const rejectCollegeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const request = await CollegeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: `Request already ${request.status}` });
    }

    request.status = "rejected";
    request.rejectionReason = reason;
    request.reviewedBy = req.result?._id;
    request.reviewedAt = new Date();
    await request.save();

    sendCollegeRejectedEmail({
      toEmail: request.adminEmail,
      collegeName: request.Collage_name,
      reason,
    }).catch((err) => console.error("Failed to send rejection email:", err));

    res.status(200).json({ success: true, message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  adminCreateCollege,
  getAllColleges,
  updateCollege,
  deleteCollege,
  getCollegeStudents,
  makeStudentCollegeAdmin,
  getCollegeLeaderboard,
  requestCollege,
  getCollegeRequests,
  approveCollegeRequest,
  resendApprovalEmail,
  rejectCollegeRequest,
};