const McqContest = require('../models/McqContest');

// Loads the contest into req.mcqContest. Must run before any of the
// checks below, which all depend on it.
const mcqContestExists = async (req, res, next) => {
    try {
        const contest = await McqContest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ message: 'MCQ contest not found' });
        }
        req.mcqContest = contest;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// Admin can edit/delete any MCQ contest. CollageAdmin only ones they created.
const isMcqContestOwner = (req, res, next) => {
    const { role, _id } = req.result;
    const contest = req.mcqContest;

    if (role === 'Admin') return next();

    if (role === 'CollageAdmin' && String(contest.createdBy) === String(_id)) {
        return next();
    }

    return res.status(403).json({ message: 'You are not allowed to modify this contest' });
};

// Blocks access before the contest window has opened.
const mcqContestStarted = (req, res, next) => {
    if (new Date() < new Date(req.mcqContest.startTime)) {
        return res.status(403).json({ message: 'Contest has not started yet' });
    }
    next();
};

// Blocks submissions once the contest window has closed.
const mcqContestOngoing = (req, res, next) => {
    if (new Date() > new Date(req.mcqContest.endTime)) {
        return res.status(403).json({ message: 'Contest has already ended' });
    }
    next();
};

// Only registered participants may view questions / submit / report violations.
const isMcqRegistered = (req, res, next) => {
    const contest = req.mcqContest;
    const userId = req.result._id;

    const registered = contest.participants.some(
        (p) => p.toString() === userId.toString()
    );

    if (!registered && req.result.role === 'User') {
        return res.status(403).json({ message: 'You must register/join this contest first' });
    }

    next();
};

module.exports = {
    mcqContestExists,
    isMcqContestOwner,
    mcqContestStarted,
    mcqContestOngoing,
    isMcqRegistered,
};