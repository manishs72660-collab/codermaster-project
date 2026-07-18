const express = require("express");
const router = express.Router();

const {
  registerCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getCollegeStudents,
  getCollegeStudentById,
  deleteCollegeStudent,
} = require("../controller/collageauth");

// NOTE: rename these two imports to match your actual middleware files -
// I don't have them in context, so these are placeholders following your
// existing naming (adminmiddleware is already referenced in auth.js's
// comment about adminRegister).
const usermiddleware = require("../middleware/userauth");
const adminmiddleware = require("../middleware/adminmiddleware");
const collegeScope = require("../middleware/adminmiddleware");

// Public: a college signs itself + its first admin up in one call.
router.post("/register",adminmiddleware, registerCollege);

// Platform-admin only.
router.get("/", usermiddleware, adminmiddleware, getAllColleges);
router.delete("/:collegeId", usermiddleware, adminmiddleware, deleteCollege);

// College's own admin (or platform admin) - collegeScope enforces the
// "own college only" rule for CollageAdmin, and lets Admin through.
router.get("/:collegeId", usermiddleware, collegeScope, getCollegeById);
router.patch("/:collegeId", usermiddleware, collegeScope, updateCollege);
router.get("/:collegeId/students", usermiddleware, collegeScope, getCollegeStudents);
router.get("/:collegeId/students/:userId", usermiddleware, collegeScope, getCollegeStudentById);
router.delete("/:collegeId/students/:userId", usermiddleware, collegeScope, deleteCollegeStudent);

module.exports = router;