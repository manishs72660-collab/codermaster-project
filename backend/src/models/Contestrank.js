const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestRankSchema = new Schema({
    contestId: {
        type: Schema.Types.ObjectId,
        ref: 'Contest',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    totalSolved: {
        type: Number,
        default: 0,
    },
    lastSolvedAt: {
        type: Date,
        default: null,
    },
    rank: {
        type: Number,
        default: null,
    },
    solvedProblems: [
        {
            problemId: {
                type: Schema.Types.ObjectId,
                ref: 'problem',
            },
            solvedAt: Date,
            attempts: {
                type: Number,
                default: 0,
            },
        }
    ],

    // ─── Anti-cheat: tab switch / minimize tracking ────────────────────────
    // Incremented once per hidden->visible cycle while the contest is live.
    // 1st => warning, 2nd => strict warning, 3rd => disqualified.
    violationCount: {
        type: Number,
        default: 0,
    },
    disqualified: {
        type: Boolean,
        default: false,
    },
    disqualifiedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

contestRankSchema.index({ contestId: 1, userId: 1 }, { unique: true });

const ContestRank = mongoose.model('ContestRank', contestRankSchema);
module.exports = ContestRank;