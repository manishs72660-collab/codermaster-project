const express = require("express");
const router = express.Router();

const {
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
} = require("../controller/collageauth");

const usermiddleware = require("../middleware/userauth");
const adminmiddleware = require("../middleware/adminmiddleware");
const collegeScope = require("../middleware/collegeScope"); // tenant-isolation check: Admin, or that college's own admin

// Platform-admin only.
router.get("/", usermiddleware, adminmiddleware, getAllColleges);
// Creates a college + its first CollageAdmin. Does not touch the caller's
// own session cookies (unlike a public self-signup flow would).
router.post("/", usermiddleware, adminmiddleware, adminCreateCollege);
router.delete("/:collegeId", usermiddleware, adminmiddleware, deleteCollege);

// -- college registration requests (public → admin review) ----------------
// PUBLIC - no auth. Called by the "Register your college" popup on the
// Signup page. Saves a CollegeRequest doc + emails the platform admin.
// Does NOT create the college or any account yet.
router.post("/request", requestCollege);
// Platform-admin only. Review queue for pending/approved/rejected requests.
router.get("/requests", usermiddleware, adminmiddleware, getCollegeRequests);
// Platform-admin only. Creates the real College + CollageAdmin account and
// emails the requester their temp login.
router.post("/requests/:requestId/approve", usermiddleware, adminmiddleware, approveCollegeRequest);
// Platform-admin only. Marks the request rejected and emails the requester.
router.post("/requests/:requestId/reject", usermiddleware, adminmiddleware, rejectCollegeRequest);

// College's own admin (or platform admin) - collegeScope enforces the
// "own college only" rule for CollageAdmin, and lets Admin through.
router.patch("/:collegeId", usermiddleware, collegeScope, updateCollege);
router.get("/:collegeId/students", usermiddleware, collegeScope, getCollegeStudents);
// Promotes a student in this college to CollageAdmin. Any number of
// co-admins can exist - collegeScope only checks role + collegeId.
router.patch("/:collegeId/students/:userId/make-admin", usermiddleware, collegeScope, makeStudentCollegeAdmin);

module.exports = router;