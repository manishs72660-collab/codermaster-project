const Contest = require('../models/Contest');

// Platform Admin AND College Admin can create/update/delete contests.
// (Previously platform-Admin-only - opened up so a college's own admin
// can run contests for their students too.)
const isAdmin = (req, res, next) => {
    if (!req.result || (req.result.role !== 'Admin' && req.result.role !== 'CollageAdmin')) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// NEW — ownership gate for update/delete. Must run AFTER contestExists
// (reads req.contest). Platform Admin can manage any contest. CollageAdmin
// can only manage contests they personally created (req.contest.createdBy
// === req.result._id) — this stops one college admin from editing or
// deleting another college admin's contest, even one within their own
// college. Regular Users never reach this (isAdmin already excludes them
// upstream, but the role is re-checked here defensively).
const isContestOwner = (req, res, next) => {
    if (!req.result) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.result.role === 'Admin') {
        return next();
    }

    if (req.result.role === 'CollageAdmin') {
        const isCreator = req.contest.createdBy.toString() === req.result._id.toString();
        if (!isCreator) {
            return res.status(403).json({ message: 'You can only manage contests you created' });
        }
        return next();
    }

    return res.status(403).json({ message: 'Access denied. Admins only.' });
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

module.exports = { isAdmin, isContestOwner, contestExists, contestStarted, contestOngoing, isRegistered };