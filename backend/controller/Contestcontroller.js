const crypto = require('crypto');
const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const ContestRank = require('../models/ContestRank');
const Problem = require('../models/problemschema');

// ─── Reuse your existing Judge0 helpers from submit.js ───────────────────────
const { submitBatch, submitToken, getLanguageById } = require('../utils/probelmutlity');
const { buildFullCode } = require('./userproblem');

// ─── Join-code generator for private contests ───────────────────────────────
// Produces a short, human-typeable code e.g. "K4F9XQ"
const generateJoinCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
};

const generateUniqueJoinCode = async () => {
    let code = generateJoinCode();
    let existing = await Contest.findOne({ joinCode: code });
    while (existing) {
        code = generateJoinCode();
        existing = await Contest.findOne({ joinCode: code });
    }
    return code;
};

// ════════════════════════════════════════════════════════════════════
//  ADMIN CONTROLLERS
// ════════════════════════════════════════════════════════════════════

// POST /contest/create
const createContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems, isPublic } = req.body;

        if (!title || !description || !startTime || !endTime) {
            return res.status(400).json({ message: 'title, description, startTime, endTime are required' });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        // Validate all problem IDs exist
        if (problems && problems.length > 0) {
            const found = await Problem.find({ _id: { $in: problems } }).select('_id');
            if (found.length !== problems.length) {
                return res.status(400).json({ message: 'One or more problem IDs are invalid' });
            }
        }

        // Private contests get a join code; public ones don't need one.
        const resolvedIsPublic = isPublic ?? true;
        let joinCode = null;
        if (resolvedIsPublic === false) {
            joinCode = await generateUniqueJoinCode();
        }

        const contest = await Contest.create({
            title,
            description,
            startTime,
            endTime,
            problems: problems || [],
            isPublic: resolvedIsPublic,
            joinCode,
            createdBy: req.result._id,
        });

        // NOTE: `contest` here includes joinCode — this is returned to the
        // creator (Admin) only, directly from the create response. The
        // frontend must capture this from the response body, since it is
        // never exposed again through the public /contest/all list.
        res.status(201).json({ message: 'Contest created successfully', contest });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// PUT /contest/:id/update
const updateContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems, isPublic } = req.body;

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        const existing = await Contest.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        const update = { title, description, startTime, endTime, problems, isPublic };

        // If switching from public -> private, mint a join code.
        // If switching from private -> public, clear it.
        if (isPublic === false && !existing.joinCode) {
            update.joinCode = await generateUniqueJoinCode();
        } else if (isPublic === true) {
            update.joinCode = null;
        }

        const updated = await Contest.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Contest updated', contest: updated });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// DELETE /contest/:id/delete
const deleteContest = async (req, res) => {
    try {
        await Contest.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Contest deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// ════════════════════════════════════════════════════════════════════
//  PUBLIC CONTROLLERS
// ════════════════════════════════════════════════════════════════════

// GET /contest/all  — list ALL contests (public + private), grouped by status.
//
// FIX: previously filtered to { isPublic: true }, which meant:
//   1. Private contests never showed up on the public /contest listing page
//      (so users had no way to even know a private contest existed, beyond
//      an invite link nobody sends).
//   2. Private contests also vanished from the Admin "Manage Contests" page,
//      since it reuses this same endpoint — admins couldn't edit/delete
//      their own private contests.
//
// This is safe to open up because joinCode is intentionally excluded from
// .select() below — it is NEVER present in this response, public or private.
const getAllContests = async (req, res) => {
    try {
        const now = new Date();

        const contests = await Contest.find({})
            .select('title description startTime endTime problems participants status isPublic createdBy')
            .sort({ startTime: 1 });

        const result = contests.map((c) => ({
            ...c.toObject(),
            computedStatus:
                now < c.startTime ? 'upcoming'
                : now <= c.endTime ? 'ongoing'
                : 'ended',
            totalProblems: c.problems.length,
            totalParticipants: c.participants.length,
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// GET /contest/:id  — get single contest detail
const getContestById = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('problems', 'title difficulty');

        if (!contest) return res.status(404).json({ message: 'Contest not found' });

        const now = new Date();
        const computedStatus =
            now < contest.startTime ? 'upcoming'
            : now <= contest.endTime ? 'ongoing'
            : 'ended';

        const isRegistered = contest.participants.some(
            (p) => p.toString() === req.result?._id?.toString()
        );

        // Never leak the join code to non-participants of a private contest.
        const contestObj = contest.toObject();
        const isCreator = contest.createdBy?._id?.toString() === req.result?._id?.toString();
        if (contestObj.isPublic === false && !isRegistered && !isCreator) {
            delete contestObj.joinCode;
        }

        res.status(200).json({
            ...contestObj,
            computedStatus,
            isRegistered,
            totalParticipants: contest.participants.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// POST /contest/:id/register  — PUBLIC contests only
const registerForContest = async (req, res) => {
    try {
        const contest = req.contest;
        const userId = req.result._id;
        const now = new Date();

        if (contest.isPublic === false) {
            return res.status(403).json({
                message: 'This is a private contest. Please join using the invite code instead.',
            });
        }

        if (now > contest.endTime) {
            return res.status(400).json({ message: 'Contest has already ended. Cannot register.' });
        }

        const alreadyRegistered = contest.participants.some(
            (p) => p.toString() === userId.toString()
        );

        if (alreadyRegistered) {
            return res.status(400).json({ message: 'You are already registered for this contest.' });
        }

        contest.participants.push(userId);
        await contest.save();

        await ContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Successfully registered for the contest!' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// POST /contest/join  — join a PRIVATE contest using its invite code
const joinContestByCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.result._id;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'Join code is required' });
        }

        const contest = await Contest.findOne({ joinCode: code.trim().toUpperCase() });
        if (!contest) {
            return res.status(404).json({ message: 'Invalid join code' });
        }

        const now = new Date();
        if (now > contest.endTime) {
            return res.status(400).json({ message: 'Contest has already ended. Cannot join.' });
        }

        const alreadyRegistered = contest.participants.some(
            (p) => p.toString() === userId.toString()
        );

        if (alreadyRegistered) {
            return res.status(200).json({ message: 'Already joined', contestId: contest._id });
        }

        contest.participants.push(userId);
        await contest.save();

        await ContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Joined private contest successfully!', contestId: contest._id });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// GET /contest/:id/problems  — only accessible after contest starts
const getContestProblems = async (req, res) => {
    try {
        const contest = req.contest;

        const problems = await Problem.find({ _id: { $in: contest.problems } })
            .select('title difficulty tags visibleTestCases startCode');
        // ⚠️  Hidden test cases and driver code are NOT sent to frontend

        res.status(200).json({ problems, contestTitle: contest.title });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// GET /contest/:id/problem/:problemId  — single problem in contest
const getContestProblem = async (req, res) => {
    try {
        const contest = req.contest;
        const { problemId } = req.params;

        const isInContest = contest.problems.some((p) => p.toString() === problemId);
        if (!isInContest) {
            return res.status(404).json({ message: 'Problem not found in this contest' });
        }

        const problem = await Problem.findById(problemId)
            .select('title description difficulty tags visibleTestCases startCode');

        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        res.status(200).json(problem);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// ════════════════════════════════════════════════════════════════════
//  CONTEST SUBMISSION  (same judge as your submit.js, contest-aware)
// ════════════════════════════════════════════════════════════════════

// POST /contest/:id/submit/:problemId
const contestSubmit = async (req, res) => {
    try {
        const userId = req.result._id;
        const { id: contestId, problemId } = req.params;
        const { code, language: rawLanguage } = req.body;

        if (!code || !rawLanguage) {
            return res.status(400).json({ message: 'code and language are required' });
        }

        const language = rawLanguage === 'cpp' ? 'c++' : rawLanguage;

        // Verify problem belongs to this contest
        const contest = req.contest;
        const isInContest = contest.problems.some((p) => p.toString() === problemId);
        if (!isInContest) {
            return res.status(404).json({ message: 'Problem not found in this contest' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        // Get driver code (same as your existing submit)
        const driverEntry = problem.driverCode?.find(
            (d) => d.language.toLowerCase() === language.toLowerCase()
        );
        if (!driverEntry) {
            return res.status(400).json({ message: `No driver code found for language: ${language}` });
        }

        const fullCode = buildFullCode(code, driverEntry.code, language);

        // Create submission record
        const submission = await ContestSubmission.create({
            userId,
            contestId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases.length,
        });

        // Send to Judge0
        const languageId = getLanguageById(language);
        const submissions = problem.hiddenTestCases.map((tc) => ({
            source_code: fullCode,
            language_id: languageId,
            stdin: tc.input,
            expected_output: tc.output,
        }));

        const submitResult = await submitBatch(submissions);
        const tokens = submitResult.map((v) => v.token);
        const testResult = await submitToken(tokens);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time);
                memory = Math.max(memory, test.memory);
            } else {
                status = test.status_id === 4 ? 'error' : 'wrong';
                errorMessage = test.stderr || test.compile_output || null;
            }
        }

        submission.status = status;
        submission.testCasesPassed = testCasesPassed;
        submission.errorMessage = errorMessage;
        submission.runtime = runtime;
        submission.memory = memory;
        submission.submittedAt = new Date();
        await submission.save();

        // ── Update leaderboard rank if accepted ──────────────────────────────
        if (status === 'accepted') {
            await updateLeaderboard(contestId, userId, problemId, submission.submittedAt);

            // Emit real-time leaderboard update via Socket.io
            const io = req.app.get('io');
            if (io) {
                const leaderboard = await computeLeaderboard(contestId);
                io.to(`contest-${contestId}`).emit('contest:leaderboard_update', leaderboard);
            }
        }

        res.status(201).json({
            accepted: status === 'accepted',
            totalTestCases: submission.testCasesTotal,
            passedTestCases: testCasesPassed,
            runtime,
            memory,
            errorMessage,
        });

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};


// ════════════════════════════════════════════════════════════════════
//  LEADERBOARD
// ════════════════════════════════════════════════════════════════════

// GET /contest/:id/leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await computeLeaderboard(req.params.id);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// Internal helper: compute ranked leaderboard for a contest
const computeLeaderboard = async (contestId) => {
    const ranks = await ContestRank.find({ contestId })
        .populate('userId', 'firstName lastName profileImage')
        .lean();

    // Sort: most solved first → if tie, earlier lastSolvedAt wins
    ranks.sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        if (!a.lastSolvedAt) return 1;
        if (!b.lastSolvedAt) return -1;
        return new Date(a.lastSolvedAt) - new Date(b.lastSolvedAt);
    });

    return ranks.map((r, index) => ({
        rank: index + 1,
        user: r.userId,
        totalSolved: r.totalSolved,
        lastSolvedAt: r.lastSolvedAt,
        solvedProblems: r.solvedProblems,
    }));
};

// Internal helper: update rank entry when user gets AC
const updateLeaderboard = async (contestId, userId, problemId, solvedAt) => {
    let rankEntry = await ContestRank.findOne({ contestId, userId });

    if (!rankEntry) {
        rankEntry = new ContestRank({ contestId, userId });
    }

    // Check if already solved this problem before
    const alreadySolved = rankEntry.solvedProblems.some(
        (sp) => sp.problemId.toString() === problemId.toString()
    );

    if (alreadySolved) return; // Don't double-count

    // Count wrong attempts for this problem before this AC
    const wrongAttempts = await ContestSubmission.countDocuments({
        contestId,
        userId,
        problemId,
        status: { $in: ['wrong', 'error'] },
        submittedAt: { $lt: solvedAt },
    });

    rankEntry.solvedProblems.push({
        problemId,
        solvedAt,
        attempts: wrongAttempts,
    });

    rankEntry.totalSolved = rankEntry.solvedProblems.length;
    rankEntry.lastSolvedAt = solvedAt;

    await rankEntry.save();
};

// GET /contest/:id/my-submissions  — user's own submissions in a contest
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await ContestSubmission.find({
            contestId: req.params.id,
            userId: req.result._id,
        })
            .populate('problemId', 'title difficulty')
            .sort({ submittedAt: -1 });

        res.status(200).json(submissions);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

module.exports = {
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
};