const mongoose = require('mongoose');

const mcqContestRankSchema = new mongoose.Schema({
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'McqContest', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
    // ── Anti-cheat, same 3-strike pattern as the coding contest ──────────
    violationCount: { type: Number, default: 0 },
    disqualified: { type: Boolean, default: false },
    disqualifiedAt: { type: Date, default: null },
}, { timestamps: true });

mcqContestRankSchema.index({ contestId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('McqContestRank', mcqContestRankSchema);