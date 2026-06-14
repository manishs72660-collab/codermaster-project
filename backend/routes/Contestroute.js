const express = require('express');
const router = express.Router();

const  userAuth = require('../middleware/userauth');
const {
    isAdmin,
    contestExists,
    contestStarted,
    contestOngoing,
    isRegistered,
} = require('../middleware/contestMiddleware');

const {
    createContest,
    updateContest,
    deleteContest,
    getAllContests,
    getContestById,
    registerForContest,
    getContestProblems,
    getContestProblem,
    contestSubmit,
    getLeaderboard,
    getMySubmissions,
} = require('../controller/contestController');


// ════════════════════════════════════════════════════
//  STATIC ROUTES FIRST  (must come before /:id routes)
// ════════════════════════════════════════════════════

// List all public contests
router.get('/all', userAuth, getAllContests);

// Create a new contest (Admin only)
router.post('/create', userAuth, isAdmin, createContest);


// ════════════════════════════════════════════════════
//  DYNAMIC /:id ROUTES  (always below static routes)
// ════════════════════════════════════════════════════

// Get single contest info
router.get('/:id', userAuth, contestExists, getContestById);

// Register for a contest
router.post('/:id/register', userAuth, contestExists, registerForContest);

// Update a contest (Admin only)
router.put('/:id/update', userAuth, isAdmin, contestExists, updateContest);

// Delete a contest (Admin only)
router.delete('/:id/delete', userAuth, isAdmin, contestExists, deleteContest);

// Get all problems of a contest
router.get('/:id/problems', userAuth, contestExists, contestStarted, isRegistered, getContestProblems);

// Get a single problem in the contest
router.get('/:id/problem/:problemId', userAuth, contestExists, contestStarted, isRegistered, getContestProblem);

// Submit code for a contest problem
router.post('/:id/submit/:problemId', userAuth, contestExists, contestStarted, contestOngoing, isRegistered, contestSubmit);

// Get leaderboard
router.get('/:id/leaderboard', userAuth, contestExists, contestStarted, getLeaderboard);

// Get my own submissions in a contest
router.get('/:id/my-submissions', userAuth, contestExists, getMySubmissions);


module.exports = router;