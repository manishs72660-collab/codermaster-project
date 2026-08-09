const express = require('express');
const router = express.Router();

const userAuth = require('../middleware/userauth');
const { isAdmin } = require('../middleware/Contestmiddleware'); // reused role gate: Admin OR CollageAdmin
const {
    mcqContestExists,
    isMcqContestOwner,
    mcqContestStarted,
    mcqContestOngoing,
    isMcqRegistered,
} = require('../middleware/McqContestMiddleware');

const {
    createMcqContest,
    updateMcqContest,
    deleteMcqContest,
    getAllMcqContests,
    getMcqContestById,
    registerForMcqContest,
    joinMcqContestByCode,
    getMcqQuestions,
    submitMcqAnswers,
    getMcqLeaderboard,
    getMyMcqSubmission,
    reportMcqViolation,
    getMcqContestForEdit,
} = require('../controller/McqContestController');


// ════════════════════════════════════════════════════
//  STATIC ROUTES FIRST  (must come before /:id routes)
// ════════════════════════════════════════════════════

// List MCQ contests — same Admin / CollageAdmin / User scoping as the
// coding contest list, done server-side in the controller.
router.get('/all', userAuth, getAllMcqContests);

// Create a new MCQ contest — isAdmin lets Admin OR CollageAdmin through.
// Body: { title, description, startTime, endTime, isPublic, collegeId?,
//         durationMinutes?, questions: [{ questionText, options: [4],
//         correctOption: 0-3, marks?, explanation? }] }  (max 20 questions)
router.post('/create', userAuth, isAdmin, createMcqContest);

// Join a PRIVATE contest using its invite code
router.post('/join', userAuth, joinMcqContestByCode);


// ════════════════════════════════════════════════════
//  DYNAMIC /:id ROUTES  (always below static routes)
// ════════════════════════════════════════════════════

// Get single contest info (no question content here)
router.get('/:id', userAuth, mcqContestExists, getMcqContestById);
router.get('/:id/edit', userAuth, isAdmin, mcqContestExists, isMcqContestOwner, getMcqContestForEdit);
// Register for a PUBLIC contest (private contests are rejected — use /join)
router.post('/:id/register', userAuth, mcqContestExists, registerForMcqContest);

// Update a contest. mcqContestExists runs first so isMcqContestOwner has
// req.mcqContest to check ownership against.
router.put('/:id/update', userAuth, mcqContestExists, isMcqContestOwner, updateMcqContest);

// Delete a contest — same ownership rule as update.
router.delete('/:id/delete', userAuth, mcqContestExists, isMcqContestOwner, deleteMcqContest);

// Get all questions (answers stripped) — only after contest starts, participants only.
router.get('/:id/questions', userAuth, mcqContestExists, mcqContestStarted, isMcqRegistered, getMcqQuestions);

// Submit the whole answer sheet — one shot, while the contest is live.
router.post('/:id/submit', userAuth, mcqContestExists, mcqContestStarted, mcqContestOngoing, isMcqRegistered, submitMcqAnswers);

// Report a tab-switch / minimize violation (registered participants only).
router.post('/:id/violation', userAuth, mcqContestExists, isMcqRegistered, reportMcqViolation);

// Get leaderboard (per-contest)
router.get('/:id/leaderboard', userAuth, mcqContestExists, mcqContestStarted, getMcqLeaderboard);

// Get my own graded submission (correct answers + explanations included)
router.get('/:id/my-submission', userAuth, mcqContestExists, getMyMcqSubmission);


module.exports = router;