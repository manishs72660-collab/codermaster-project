// Assumes an upstream auth middleware has already verified the access
// token and attached the user document to req.result - the same pattern
// used elsewhere in this app (see deleteUser/logout/profile in auth.js).
// Adjust the import path in your routes file to whatever that middleware
// is actually called (referred to as `usermiddleware` in collegeRoutes.js).
const collegeScope = (req, res, next) => {
  if (!req.result) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const { role, collegeId } = req.result;

  // Platform admins aren't scoped to any single college.
  if (role === "Admin") return next();

  if (role !== "CollageAdmin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const requestedCollegeId = req.params.collegeId;
  if (!collegeId || String(collegeId) !== String(requestedCollegeId)) {
    return res.status(403).json({ success: false, message: "You can only manage your own college" });
  }

  next();
};

module.exports = collegeScope;