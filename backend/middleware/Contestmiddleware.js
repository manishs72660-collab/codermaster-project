const Contest = require('../models/Contest');

// Only Admin role can create/update/delete contests
const isAdmin = (req, res, next) => {
    if (!req.result || req.result.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// Check contest exists and attach to req
const contestExists = async (req, res, next) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        req.contest = contest;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid contest ID', error: err.message });
    }
};

// Check contest has started (for accessing problems/submitting)
const contestStarted = (req, res, next) => {
    const now = new Date();
    if (now < req.contest.startTime) {
        return res.status(403).json({
            message: 'Contest has not started yet',
            startsAt: req.contest.startTime,
        });
    }
    next();
};

// Check contest is still ongoing (for submitting)
const contestOngoing = (req, res, next) => {
    const now = new Date();
    if (now > req.contest.endTime) {
        return res.status(403).json({ message: 'Contest has ended. Submissions are closed.' });
    }
    next();
};

// Check user is registered for the contest
const isRegistered = (req, res, next) => {
    const userId = req.result._id.toString();
    const isParticipant = req.contest.participants.some(
        (p) => p.toString() === userId
    );
    if (!isParticipant) {
        return res.status(403).json({ message: 'You are not registered for this contest.' });
    }
    next();
};

module.exports = { isAdmin, contestExists, contestStarted, contestOngoing, isRegistered };