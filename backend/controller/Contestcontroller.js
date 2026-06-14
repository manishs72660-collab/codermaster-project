const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const ContestRank = require('../models/ContestRank');
const Problem = require('../models/problemschema');

// ─── Reuse your existing Judge0 helpers from submit.js ───────────────────────
// These are imported from your existing submit utility — adjust path if needed
const { submitBatch, submitToken, getLanguageById} = require('../utils/probelmutlity');
const {buildFullCode}=require("./userproblem");
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

        const contest = await Contest.create({
            title,
            description,
            startTime,
            endTime,
            problems: problems || [],
            isPublic: isPublic ?? true,
            createdBy: req.result._id,
        });

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

        const updated = await Contest.findByIdAndUpdate(
            req.params.id,
            { title, description, startTime, endTime, problems, isPublic },
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

// GET /contest/all  — list all contests grouped by status
const getAllContests = async (req, res) => {
    try {
        const now = new Date();

        const contests = await Contest.find({ isPublic: true })
            .select('title description startTime endTime problems participants status')
            .sort({ startTime: 1 });

        // Attach computed status to each
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

        res.status(200).json({
            ...contest.toObject(),
            computedStatus,
            isRegistered,
            totalParticipants: contest.participants.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// POST /contest/:id/register
const registerForContest = async (req, res) => {
    try {
        const contest = req.contest;
        const userId = req.result._id;
        const now = new Date();

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

        // Create an empty rank entry for this user
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
    getContestProblems,
    getContestProblem,
    contestSubmit,
    getLeaderboard,
    getMySubmissions,
};