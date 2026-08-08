const express = require('express');
const router = express.Router();

const userAuth = require('../middleware/userauth');
const {
    isAdmin,
    isContestOwner,
    contestExists,
    contestStarted,
    contestOngoing,
    isRegistered,
} = require('../middleware/Contestmiddleware');

const {
    createContest,
    updateContest,
    deleteContest,
    getAllContests,
    getContestById,
    registerForContest,
    joinContestByCode,
    getContestProblems,
    getContestProblem,
    contestSubmit,
    getLeaderboard,
    getMySubmissions,
    reportViolation,
} = require('../controller/Contestcontroller');


// ════════════════════════════════════════════════════
//  STATIC ROUTES FIRST  (must come before /:id routes)
// ════════════════════════════════════════════════════

// List contests. Scoped server-side by role/college in the controller:
//   - Admin sees everything
//   - CollageAdmin sees their college's contests + global ones (this is
//     also what the College Admin "Manage Contests" page calls)
//   - regular User sees their college's contests + global ones
router.get('/all', userAuth, getAllContests);

// Create a new contest — isAdmin already lets Admin OR CollageAdmin through.
// A CollageAdmin's contest is auto-scoped to their own college inside the
// controller. Pass isPublic: false to make it private.
router.post('/create', userAuth, isAdmin, createContest);

// Join a PRIVATE contest using its invite code
router.post('/join', userAuth, joinContestByCode);


// ════════════════════════════════════════════════════
//  DYNAMIC /:id ROUTES  (always below static routes)
// ════════════════════════════════════════════════════

// Get single contest info
router.get('/:id', userAuth, contestExists, getContestById);

// Register for a PUBLIC contest (private contests are rejected — use /contest/join)
router.post('/:id/register', userAuth, contestExists, registerForContest);

// Update a contest. contestExists must run first so isContestOwner has
// req.contest to check ownership against: Admin can edit any contest,
// CollageAdmin only contests they personally created.
router.put('/:id/update', userAuth, contestExists, isContestOwner, updateContest);

// Delete a contest — same ownership rule as update.
router.delete('/:id/delete', userAuth, contestExists, isContestOwner, deleteContest);

// Get all problems of a contest
router.get('/:id/problems', userAuth, contestExists, contestStarted, isRegistered, getContestProblems);

// Get a single problem in the contest
router.get('/:id/problem/:problemId', userAuth, contestExists, contestStarted, isRegistered, getContestProblem);

// Submit code for a contest problem
router.post('/:id/submit/:problemId', userAuth, contestExists, contestStarted, contestOngoing, isRegistered, contestSubmit);

// Report a tab-switch / minimize violation (registered participants only,
// tracked while the contest is live — see reportViolation for the gating).
router.post('/:id/violation', userAuth, contestExists, isRegistered, reportViolation);

// Get leaderboard (per-contest)
router.get('/:id/leaderboard', userAuth, contestExists, contestStarted, getLeaderboard);

// Get my own submissions in a contest
router.get('/:id/my-submissions', userAuth, contestExists, getMySubmissions);


module.exports = router;