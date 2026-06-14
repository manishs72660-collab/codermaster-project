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
    // Finish time of LAST accepted problem (used as tiebreaker)
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
            solvedAt: Date,          // when they first got AC
            attempts: {              // how many wrong attempts before AC
                type: Number,
                default: 0,
            },
        }
    ],
}, { timestamps: true });

// One rank entry per user per contest
contestRankSchema.index({ contestId: 1, userId: 1 }, { unique: true });

const ContestRank = mongoose.model('ContestRank', contestRankSchema);
module.exports = ContestRank;