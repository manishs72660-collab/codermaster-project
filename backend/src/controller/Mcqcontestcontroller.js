const crypto = require('crypto');
const McqContest = require('../models/Mcqcontest');
const McqSubmission = require('../models/Mcqsubmission');
const McqContestRank = require('../models/Mcqcontestrank');

const MAX_QUESTIONS = 20;

// ─── Join-code generator (same pattern as the coding-contest controller) ────
const generateJoinCode = () => crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

const generateUniqueJoinCode = async () => {
    let code = generateJoinCode();
    while (await McqContest.findOne({ joinCode: code })) {
        code = generateJoinCode();
    }
    return code;
};

// Validates the raw `questions` array from the request body before it ever
// touches the DB. Returns an error string, or null if everything is fine.
const validateQuestions = (questions) => {
    if (!Array.isArray(questions) || questions.length === 0) {
        return 'At least 1 question is required';
    }
    if (questions.length > MAX_QUESTIONS) {
        return `A contest can have at most ${MAX_QUESTIONS} questions`;
    }
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !String(q.questionText).trim()) {
            return `Question ${i + 1}: questionText is required`;
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
            return `Question ${i + 1}: exactly 4 options are required`;
        }
        if (q.options.some((o) => !o || !String(o.text ?? o).trim())) {
            return `Question ${i + 1}: options cannot be empty`;
        }
        if (
            q.correctOption === undefined ||
            q.correctOption === null ||
            ![0, 1, 2, 3].includes(Number(q.correctOption))
        ) {
            return `Question ${i + 1}: correctOption must be 0, 1, 2 or 3`;
        }
        // code is optional, but if the client sent a code object it must
        // actually carry a non-empty snippet — reject empty/partial ones
        // rather than silently storing a blank code block.
        if (q.code !== undefined && q.code !== null) {
            if (typeof q.code !== 'object' || Array.isArray(q.code)) {
                return `Question ${i + 1}: code must be an object with language and content`;
            }
            if (!q.code.content || !String(q.code.content).trim()) {
                return `Question ${i + 1}: code.content cannot be empty when code is provided`;
            }
        }
    }
    return null;
};

// Normalizes options to { text } shape regardless of whether the client
// sent plain strings or { text } objects, and coerces numeric fields.
const normalizeQuestions = (questions) =>
    questions.map((q) => {
        const normalized = {
            questionText: String(q.questionText).trim(),
            options: q.options.map((o) => ({ text: String(o.text ?? o).trim() })),
            correctOption: Number(q.correctOption),
            marks: q.marks && q.marks > 0 ? q.marks : 1,
            explanation: q.explanation ? String(q.explanation).trim() : '',
        };
        // Only attach `code` when meaningfully present, so questions without
        // it don't end up with an empty subdocument in the DB.
        if (q.code && String(q.code.content ?? '').trim()) {
            normalized.code = {
                language: q.code.language ? String(q.code.language).trim() : 'javascript',
                content: String(q.code.content).trim(),
            };
        }
        return normalized;
    });

// Strips answer-revealing fields before questions are sent to a participant.
// `code` is included — it's just the snippet the question is asking about,
// it never carries the correct answer.
const sanitizeQuestionsForParticipant = (questions) =>
    questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        ...(q.code ? { code: { language: q.code.language, content: q.code.content } } : {}),
    }));

// ════════════════════════════════════════════════════════════════════
//  ADMIN / COLLEGE-ADMIN CONTROLLERS
// ════════════════════════════════════════════════════════════════════

// POST /mcq-contest/create
// Callable by Admin or CollageAdmin (gated by isAdmin middleware, reused
// from the coding-contest routes). Body:
// { title, description, startTime, endTime, isPublic, collegeId?,
//   durationMinutes?, questions: [{ questionText, options: [4 strings],
//   correctOption: 0-3, marks?, explanation?, code?: { language, content } }] }
// (max 20 questions)
const createMcqContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, questions, isPublic, collegeId, durationMinutes } = req.body;

        if (!title || !description || !startTime || !endTime) {
            return res.status(400).json({ message: 'title, description, startTime, endTime are required' });
        }

        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        const questionError = validateQuestions(questions);
        if (questionError) {
            return res.status(400).json({ message: questionError });
        }

        const resolvedIsPublic = isPublic ?? true;
        let joinCode = null;
        if (resolvedIsPublic === false) {
            joinCode = await generateUniqueJoinCode();
        }

        // CollageAdmin: always locked to their own college (ignore body.collegeId).
        // Admin: may optionally scope it to a college, otherwise global (null).
        const resolvedCollegeId =
            req.result.role === 'CollageAdmin' ? req.result.collegeId : (collegeId || null);

        const contest = await McqContest.create({
            title,
            description,
            startTime,
            endTime,
            durationMinutes: durationMinutes || null,
            questions: normalizeQuestions(questions),
            isPublic: resolvedIsPublic,
            joinCode,
            createdBy: req.result._id,
            collegeId: resolvedCollegeId,
        });

        // joinCode + correctOption are returned here to the creator only,
        // directly from the create response — never exposed again through
        // /mcq-contest/all or the participant-facing /questions endpoint.
        res.status(201).json({ message: 'MCQ contest created successfully', contest });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// PUT /mcq-contest/:id/update
// Ownership enforced upstream by isMcqContestOwner. collegeId is
// intentionally NOT accepted here, same rule as the coding contest.
const updateMcqContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, questions, isPublic, durationMinutes } = req.body;

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ message: 'startTime must be before endTime' });
        }

        const existing = req.mcqContest;
        if (!existing) {
            return res.status(404).json({ message: 'MCQ contest not found' });
        }

        const update = { title, description, startTime, endTime, isPublic, durationMinutes };

        if (questions) {
            const questionError = validateQuestions(questions);
            if (questionError) {
                return res.status(400).json({ message: questionError });
            }
            update.questions = normalizeQuestions(questions);
        }

        // Private -> mint a join code if it doesn't have one. Public -> clear it.
        if (isPublic === false && !existing.joinCode) {
            update.joinCode = await generateUniqueJoinCode();
        } else if (isPublic === true) {
            update.joinCode = null;
        }

        const updated = await McqContest.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: 'MCQ contest updated', contest: updated });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// DELETE /mcq-contest/:id/delete
const deleteMcqContest = async (req, res) => {
    try {
        await McqContest.findByIdAndDelete(req.params.id);
        // Clean up dependent data so submissions/leaderboard entries don't
        // outlive the contest they belong to.
        await McqSubmission.deleteMany({ contestId: req.params.id });
        await McqContestRank.deleteMany({ contestId: req.params.id });
        res.status(200).json({ message: 'MCQ contest deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════
//  PUBLIC CONTROLLERS
// ════════════════════════════════════════════════════════════════════

// GET /mcq-contest/all — identical role-scoping to the coding contest list
const getAllMcqContests = async (req, res) => {
    try {
        const now = new Date();
        const { role, collegeId } = req.result;

        const filter = {};
        if (role === 'Admin') {
            // sees everything
        } else if (role === 'CollageAdmin') {
            filter.$or = [{ collegeId }, { collegeId: null }];
        } else {
            filter.$or = collegeId ? [{ collegeId }, { collegeId: null }] : [{ collegeId: null }];
        }

        const contests = await McqContest.find(filter)
            .select('title description startTime endTime questions isPublic createdBy collegeId participants')
            .populate('collegeId', 'Collage_name collegeCode')
            .sort({ startTime: 1 });

        const result = contests.map((c) => ({
            _id: c._id,
            title: c.title,
            description: c.description,
            startTime: c.startTime,
            endTime: c.endTime,
            isPublic: c.isPublic,
            collegeId: c.collegeId,
            createdBy: c.createdBy,
            computedStatus:
                now < c.startTime ? 'upcoming'
                : now <= c.endTime ? 'ongoing'
                : 'ended',
            totalQuestions: c.questions.length,
            totalParticipants: c.participants.length,
            isOwner: String(c.createdBy) === String(req.result._id),
            // joinCode and question content are intentionally never included here.
        }));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// GET /mcq-contest/:id — single contest detail (no question content here,
// that's a separate call to /questions which does its own sanitizing)
const getMcqContestById = async (req, res) => {
    try {
        const contest = await McqContest.findById(req.params.id)
            .populate('createdBy', 'firstName lastName')
            .populate('collegeId', 'Collage_name collegeCode');

        if (!contest) return res.status(404).json({ message: 'MCQ contest not found' });

        const now = new Date();
        const computedStatus =
            now < contest.startTime ? 'upcoming'
            : now <= contest.endTime ? 'ongoing'
            : 'ended';

        const userId = req.result?._id?.toString();
        const isRegistered = contest.participants.some((p) => p.toString() === userId);
        const isCreator = contest.createdBy?._id?.toString() === userId;

        let isDisqualified = false;
        let violationCount = 0;
        let hasSubmitted = false;
        if (isRegistered && userId) {
            const rankEntry = await McqContestRank.findOne({
                contestId: contest._id,
                userId,
            }).select('disqualified violationCount submittedAt');
            isDisqualified = rankEntry?.disqualified || false;
            violationCount = rankEntry?.violationCount || 0;
            hasSubmitted = !!rankEntry?.submittedAt;
        }

        const contestObj = contest.toObject();
        // Never leak the join code to non-participants of a private contest.
        if (contestObj.isPublic === false && !isRegistered && !isCreator) {
            delete contestObj.joinCode;
        }
        // Never leak correct answers via this endpoint.
        delete contestObj.questions;

        res.status(200).json({
            ...contestObj,
            computedStatus,
            isRegistered,
            isDisqualified,
            violationCount,
            hasSubmitted,
            totalQuestions: contest.questions.length,
            totalParticipants: contest.participants.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// POST /mcq-contest/:id/register — PUBLIC contests only
const registerForMcqContest = async (req, res) => {
    try {
        const contest = req.mcqContest;
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

        const alreadyRegistered = contest.participants.some((p) => p.toString() === userId.toString());
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'You are already registered for this contest.' });
        }

        contest.participants.push(userId);
        await contest.save();

        await McqContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Successfully registered for the MCQ contest!' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// POST /mcq-contest/join — join a PRIVATE contest via invite code
const joinMcqContestByCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.result._id;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'Join code is required' });
        }

        const contest = await McqContest.findOne({ joinCode: code.trim().toUpperCase() });
        if (!contest) {
            return res.status(404).json({ message: 'Invalid join code' });
        }

        const now = new Date();
        if (now > contest.endTime) {
            return res.status(400).json({ message: 'Contest has already ended. Cannot join.' });
        }

        const alreadyRegistered = contest.participants.some((p) => p.toString() === userId.toString());
        if (alreadyRegistered) {
            return res.status(200).json({ message: 'Already joined', contestId: contest._id });
        }

        contest.participants.push(userId);
        await contest.save();

        await McqContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            { contestId: contest._id, userId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Joined private MCQ contest successfully!', contestId: contest._id });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// GET /mcq-contest/:id/questions — only reachable after the contest starts
// (mcqContestStarted) and only by registered participants (isMcqRegistered).
// correctOption/explanation are ALWAYS stripped here, regardless of role.
const getMcqQuestions = async (req, res) => {
    try {
        const contest = req.mcqContest;
        res.status(200).json({
            contestTitle: contest.title,
            durationMinutes: contest.durationMinutes,
            endTime: contest.endTime,
            questions: sanitizeQuestionsForParticipant(contest.questions),
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════
//  ANTI-CHEAT: TAB SWITCH / MINIMIZE VIOLATIONS
//  (identical 3-strike pattern to the coding contest's reportViolation)
// ════════════════════════════════════════════════════════════════════

const reportMcqViolation = async (req, res) => {
    try {
        const contest = req.mcqContest;
        const userId = req.result._id;
        const now = new Date();

        if (now < contest.startTime || now > contest.endTime) {
            return res.status(200).json({ tracked: false, message: 'Contest not active' });
        }

        let rankEntry = await McqContestRank.findOne({ contestId: contest._id, userId });
        if (!rankEntry) {
            rankEntry = new McqContestRank({ contestId: contest._id, userId });
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
                const leaderboard = await computeMcqLeaderboard(contest._id);
                io.to(`mcq-contest-${contest._id}`).emit('mcq-contest:leaderboard_update', leaderboard);
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

// ════════════════════════════════════════════════════════════════════
//  SUBMISSION — one shot, whole answer sheet
// ════════════════════════════════════════════════════════════════════

// POST /mcq-contest/:id/submit
// Body: { answers: [{ questionId, selectedOption }] }
// Unlike the coding contest (per-problem submit + Judge0), MCQ grades
// instantly server-side against the stored correctOption, and can only be
// submitted ONCE per user per contest (unique index on McqSubmission).
const submitMcqAnswers = async (req, res) => {
    try {
        const contest = req.mcqContest;
        const userId = req.result._id;
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: 'answers must be an array' });
        }

        // ── Anti-cheat gate ──────────────────────────────────────────────
        const rankEntry = await McqContestRank.findOne({ contestId: contest._id, userId });
        if (rankEntry?.disqualified) {
            return res.status(403).json({
                message: 'You have been disqualified from this contest and can no longer submit.',
                disqualified: true,
            });
        }

        // ── One submission per user per contest ─────────────────────────
        const existing = await McqSubmission.findOne({ contestId: contest._id, userId });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted this contest.' });
        }

        let score = 0;
        let totalMarks = 0;
        let correctCount = 0;

        // Grade against the server-side copy of the questions — a client
        // can never inject its own correctOption or marks this way.
        const gradedAnswers = contest.questions.map((q) => {
            totalMarks += q.marks;
            const submitted = answers.find((a) => a.questionId === q._id.toString());
            const selectedOption =
                submitted && [0, 1, 2, 3].includes(Number(submitted.selectedOption))
                    ? Number(submitted.selectedOption)
                    : null;

            const isCorrect = selectedOption !== null && selectedOption === q.correctOption;
            if (isCorrect) {
                score += q.marks;
                correctCount += 1;
            }

            return { questionId: q._id, selectedOption, isCorrect };
        });

        const submission = await McqSubmission.create({
            contestId: contest._id,
            userId,
            answers: gradedAnswers,
            score,
            totalMarks,
            correctCount,
            totalQuestions: contest.questions.length,
            submittedAt: new Date(),
        });

        // ── Update leaderboard rank ──────────────────────────────────────
        await McqContestRank.findOneAndUpdate(
            { contestId: contest._id, userId },
            {
                contestId: contest._id,
                userId,
                score,
                totalMarks,
                correctCount,
                submittedAt: submission.submittedAt,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const io = req.app.get('io');
        if (io) {
            const leaderboard = await computeMcqLeaderboard(contest._id);
            io.to(`mcq-contest-${contest._id}`).emit('mcq-contest:leaderboard_update', leaderboard);
        }

        res.status(201).json({
            message: 'Submitted successfully',
            score,
            totalMarks,
            correctCount,
            totalQuestions: contest.questions.length,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════
//  LEADERBOARD
// ════════════════════════════════════════════════════════════════════

const getMcqLeaderboard = async (req, res) => {
    try {
        const leaderboard = await computeMcqLeaderboard(req.params.id);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// Internal helper: ranked by score desc, tiebreak by earliest submittedAt.
// Disqualified users sort to the bottom with rank: null.
const computeMcqLeaderboard = async (contestId) => {
    const ranks = await McqContestRank.find({ contestId })
        .populate('userId', 'firstName lastName profileImage')
        .lean();

    ranks.sort((a, b) => {
        if (!!a.disqualified !== !!b.disqualified) return a.disqualified ? 1 : -1;
        if (b.score !== a.score) return b.score - a.score;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return new Date(a.submittedAt) - new Date(b.submittedAt);
    });

    let rank = 0;
    return ranks.map((r) => {
        if (!r.disqualified) rank += 1;
        return {
            rank: r.disqualified ? null : rank,
            user: r.userId,
            score: r.score,
            totalMarks: r.totalMarks,
            correctCount: r.correctCount,
            submittedAt: r.submittedAt,
            disqualified: !!r.disqualified,
        };
    });
};

// GET /mcq-contest/:id/my-submission — the user's own graded answer sheet,
// with correct answers + explanations revealed since it's their own result.
const getMyMcqSubmission = async (req, res) => {
    try {
        const submission = await McqSubmission.findOne({
            contestId: req.params.id,
            userId: req.result._id,
        }).lean();

        if (!submission) {
            return res.status(404).json({ message: 'You have not submitted this contest yet' });
        }

        const contest = await McqContest.findById(req.params.id).select('questions title');
        const questionMap = new Map(contest.questions.map((q) => [q._id.toString(), q]));

        const detailedAnswers = submission.answers.map((a) => {
            const q = questionMap.get(a.questionId.toString());
            return {
                questionText: q?.questionText,
                options: q?.options,
                correctOption: q?.correctOption,
                explanation: q?.explanation,
                code: q?.code ? { language: q.code.language, content: q.code.content } : undefined,
                selectedOption: a.selectedOption,
                isCorrect: a.isCorrect,
                marks: q?.marks,
            };
        });

        res.status(200).json({
            contestTitle: contest.title,
            score: submission.score,
            totalMarks: submission.totalMarks,
            correctCount: submission.correctCount,
            totalQuestions: submission.totalQuestions,
            submittedAt: submission.submittedAt,
            answers: detailedAnswers,
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};
const getMcqContestForEdit = async (req, res) => {
    try {
        const contest = req.mcqContest; // already loaded + ownership-checked upstream
        res.status(200).json({ contest });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

module.exports = {
    createMcqContest,
    updateMcqContest,
    deleteMcqContest,
    getAllMcqContests,
    getMcqContestById,
     getMcqContestForEdit,
    registerForMcqContest,
    joinMcqContestByCode,
    getMcqQuestions,
    submitMcqAnswers,
    getMcqLeaderboard,
    getMyMcqSubmission,
    reportMcqViolation,
};