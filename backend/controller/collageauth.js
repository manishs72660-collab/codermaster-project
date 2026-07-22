const College = require("../models/collagescheam");
const User = require("../models/Userschema");
const Submission = require("../models/Submission");
const client = require("../config/redis");
const { createAccount, publicUser, normalizeEmail } = require("./auth");
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

// Platform-admin only. Creates the college + admin account for real (reuses
// the exact same helper the direct "Register College" admin form uses),
// generates a temp password, and emails the requester their login.
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

    sendCollegeApprovedEmail({
      toEmail: request.adminEmail,
      collegeName: college.Collage_name,
      collegeCode: college.collegeCode,
      tempPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    }).catch((err) => console.error("Failed to send approval email:", err));

    res.status(200).json({ success: true, message: "College approved and registered", college });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
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
  requestCollege,
  getCollegeRequests,
  approveCollegeRequest,
  rejectCollegeRequest,
};