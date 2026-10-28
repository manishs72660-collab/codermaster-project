const crypto = require('crypto');
const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const ContestRank = require('../models/Contestrank');
const Problem = require('../models/problemschema');

const { submitBatch, submitToken, getLanguageById } = require('../utils/probelmutlity');
const { buildFullCode } = require('./userproblem');

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

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

const createContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems, isPublic, collegeId } = req.body;

        if (!title || !description || !startTime || !endTime) {
            return res.status(400).json({ message: 'title, description, startTime, endTime are required' });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        if (problems && problems.length > 0) {
            const found = await Problem.find({ _id: { $in: problems } }).select('_id');
            if (found.length !== problems.length) {
                return res.status(400).json({ message: 'One or more problem IDs are invalid' });
            }
        }

        const resolvedIsPublic = isPublic ?? true;
        let joinCode = null;
        if (resolvedIsPublic === false) {
            joinCode = await generateUniqueJoinCode();
        }

        const resolvedCollegeId =
            req.result.role === 'CollageAdmin' ? req.result.collegeId : (collegeId || null);

        const contest = await Contest.create({
            title,
            description,
            startTime,
            endTime,
            problems: problems || [],
            isPublic: resolvedIsPublic,
            joinCode,
            createdBy: req.result._id,
            collegeId: resolvedCollegeId,
        });

        res.status(201).json({ message: 'Contest created successfully', contest });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const updateContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems, isPublic } = req.body;

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        const existing = req.contest;
        if (!existing) {
            return res.status(404).json({ message: 'Contest not found' });
        }

        const update = { title, description, startTime, endTime, problems, isPublic };

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

const deleteContest = async (req, res) => {
    try {
        await Contest.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Contest deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================

const getAllContests = async (req, res) => {
    try {
        const now = new Date();
        const { role, collegeId } = req.result;

        const filter = {};
        if (role === 'Admin') {
            // sees everything
        } else if (role === 'CollageAdmin') {
            filter.$or = [{ collegeId: collegeId }, { collegeId: null }];
        } else {
            filter.$or = collegeId ? [{ collegeId }, { collegeId: null }] : [{ collegeId: null }];
        }

        const contests = await Contest.find(filter)
            .select('title description startTime endTime problems participants status isPublic createdBy collegeId')
            .populate('collegeId', 'Collage_name collegeCode')
            .sort({ startTime: 1 });

        const result = contests.map((c) => ({
            ...c.toObject(),
            computedStatus:
                now < c.startTime ? 'upcoming'
                : now <= c.endTime ? 'ongoing'
                : 'ended',
            totalProblems: c.problems.length,
            totalParticipants: c.participants.length,
            isOwner: String(c.createdBy) === String(req.result._id),
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const getContestById = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('collegeId', 'Collage_name collegeCode')
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

        let isDisqualified = false;
        let violationCount = 0;
        if (isRegistered && req.result?._id) {
            const rankEntry = await ContestRank.findOne({
                contestId: contest._id,
                userId: req.result._id,
            }).select('disqualified violationCount');
            isDisqualified = rankEntry?.disqualified || false;
            violationCount = rankEntry?.violationCount || 0;
        }

        const contestObj = contest.toObject();
        const isCreator = contest.createdBy?._id?.toString() === req.result?._id?.toString();
        if (contestObj.isPublic === false && !isRegistered && !isCreator) {
            delete contestObj.joinCode;
        }

        res.status(200).json({
            ...contestObj,
            computedStatus,
            isRegistered,
            isDisqualified,
            violationCount,
            totalParticipants: contest.participants.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ==========================================
// 🔥 STEP 1 UPDATED: ATOMIC REGISTRATION
// ==========================================
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

        // 🔥 ATOMIC UPDATE: Push ki jagah $addToSet use kiya (Zero Race Condition)
        const updatedContest = await Contest.findByIdAndUpdate(
            contest._id,
            { $addToSet: { participants: userId } },
            { new: true }
        );

        // Check karo ki user pehle se toh nahi tha
        if (updatedContest.participants.length === contest.participants.length) {
            return res.status(400).json({ message: 'You are already registered for this contest.' });
        }

        await ContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Successfully registered for the contest!' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ==========================================
// 🔥 STEP 1 UPDATED: ATOMIC JOIN BY CODE
// ==========================================
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

        // 🔥 ATOMIC UPDATE: $addToSet duplicates ko allow nahi karta
        const updatedContest = await Contest.findByIdAndUpdate(
            contest._id,
            { $addToSet: { participants: userId } },
            { new: true }
        );

        if (updatedContest.participants.length === contest.participants.length) {
            return res.status(200).json({ message: 'Already joined', contestId: contest._id });
        }

        await ContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Joined private contest successfully!', contestId: contest._id });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const getContestProblems = async (req, res) => {
    try {
        const contest = req.contest;
        const problems = await Problem.find({ _id: { $in: contest.problems } })
            .select('title difficulty tags visibleTestCases startCode');
        res.status(200).json({ problems, contestTitle: contest.title });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

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

const reportViolation = async (req, res) => {
    try {
        const contest = req.contest;
        const userId = req.result._id;
        const now = new Date();

        if (now < contest.startTime || now > contest.endTime) {
            return res.status(200).json({ tracked: false, message: 'Contest not active' });
        }

        let rankEntry = await ContestRank.findOne({ contestId: contest._id, userId });
        if (!rankEntry) {
            rankEntry = new ContestRank({ contestId: contest._id, userId });
        }

        if (rankEntry.disqualified) {
            return res.status(200).json({
                tracked: false,
                level: 'disqualified',
                disqualified: true,
                violationCount: rankEntry.violationCount,
                message: 'You are already disqualified from this contest.',
            });
        }

        rankEntry.violationCount += 1;

        let level = 'warning';
        let message = `Warning ${rankEntry.violationCount}/3: Leaving the contest tab is being tracked. Two more and you'll be disqualified.`;

        if (rankEntry.violationCount === 2) {
            level = 'strict_warning';
            message = 'Strict warning (2/3): One more tab switch or minimize and you will be disqualified from this contest.';
        } else if (rankEntry.violationCount >= 3) {
            level = 'disqualified';
            rankEntry.disqualified = true;
            rankEntry.disqualifiedAt = now;
            message = 'You have been disqualified from this contest for repeatedly leaving the tab.';
        }

        await rankEntry.save();

        if (rankEntry.disqualified) {
            const io = req.app.get('io');
            if (io) {
                const leaderboard = await computeLeaderboard(contest._id);
                io.to(`contest-${contest._id}`).emit('contest:leaderboard_update', leaderboard);
            }
        }

        res.status(200).json({
            tracked: true,
            level,
            violationCount: rankEntry.violationCount,
            disqualified: rankEntry.disqualified,
            message,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const contestSubmit = async (req, res) => {
    try {
        const userId = req.result._id;
        const { id: contestId, problemId } = req.params;
        const { code, language: rawLanguage } = req.body;

        if (!code || !rawLanguage) {
            return res.status(400).json({ message: 'code and language are required' });
        }

        const rankEntry = await ContestRank.findOne({ contestId, userId }).select('disqualified');
        if (rankEntry?.disqualified) {
            return res.status(403).json({
                message: 'You have been disqualified from this contest and can no longer submit.',
                disqualified: true,
            });
        }

        const language = rawLanguage === 'cpp' ? 'c++' : rawLanguage;
        const contest = req.contest;
        const isInContest = contest.problems.some((p) => p.toString() === problemId);
        if (!isInContest) {
            return res.status(404).json({ message: 'Problem not found in this contest' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ message: 'Problem not found' });

        const driverEntry = problem.driverCode?.find(
            (d) => d.language.toLowerCase() === language.toLowerCase()
        );
        if (!driverEntry) {
            return res.status(400).json({ message: `No driver code found for language: ${language}` });
        }

        const fullCode = buildFullCode(code, driverEntry.code, language);

        const submission = await ContestSubmission.create({
            userId,
            contestId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases.length,
        });

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

        if (status === 'accepted') {
            await updateLeaderboard(contestId, userId, problemId, submission.submittedAt);

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

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await computeLeaderboard(req.params.id);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

const computeLeaderboard = async (contestId) => {
    const ranks = await ContestRank.find({ contestId })
        .populate('userId', 'firstName lastName profileImage')
        .lean();

    ranks.sort((a, b) => {
        if (!!a.disqualified !== !!b.disqualified) return a.disqualified ? 1 : -1;
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        if (!a.lastSolvedAt) return 1;
        if (!b.lastSolvedAt) return -1;
        return new Date(a.lastSolvedAt) - new Date(b.lastSolvedAt);
    });

    let rank = 0;
    return ranks.map((r) => {
        if (!r.disqualified) rank += 1;
        return {
            rank: r.disqualified ? null : rank,
            user: r.userId,
            totalSolved: r.totalSolved,
            lastSolvedAt: r.lastSolvedAt,
            solvedProblems: r.solvedProblems,
            disqualified: !!r.disqualified,
        };
    });
};

const updateLeaderboard = async (contestId, userId, problemId, solvedAt) => {
    let rankEntry = await ContestRank.findOne({ contestId, userId });

    if (!rankEntry) {
        rankEntry = new ContestRank({ contestId, userId });
    }

    const alreadySolved = rankEntry.solvedProblems.some(
        (sp) => sp.problemId.toString() === problemId.toString()
    );

    if (alreadySolved) return;

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
    reportViolation,
};