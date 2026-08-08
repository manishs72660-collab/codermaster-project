// Looser sibling of Collegescope.js. That one only lets a college's OWN
// CollageAdmin (or a platform Admin) through - fine for management actions
// like editing the college or promoting a student, but too strict for
// read-only, college-wide views like the leaderboard, which any regular
// student in that college should also be able to see.
//
// Assumes an upstream auth middleware (userauth.js) has already verified
// the access token and attached the user document to req.result, same
// pattern as Collegescope.js.
const collegeMemberScope = (req, res, next) => {
  if (!req.result) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const { role, collegeId } = req.result;
  const requestedCollegeId = req.params.collegeId;

  // Platform admins aren't scoped to any single college.
  if (role === "Admin") return next();

  // Any role (User or CollageAdmin) may view their own college's data.
  if (!collegeId || String(collegeId) !== String(requestedCollegeId)) {
    return res.status(403).json({ success: false, message: "You can only view your own college" });
  }

  next();
};

module.exports = collegeMemberScope;