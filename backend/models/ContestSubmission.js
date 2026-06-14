const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestSubmissionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    contestId: {
        type: Schema.Types.ObjectId,
        ref: 'Contest',
        required: true,
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'wrong', 'error'],
        default: 'pending',
    },
    testCasesTotal: {
        type: Number,
        default: 0,
    },
    testCasesPassed: {
        type: Number,
        default: 0,
    },
    runtime: {
        type: Number,  // ms
        default: 0,
    },
    memory: {
        type: Number,  // KB
        default: 0,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const ContestSubmission = mongoose.model('ContestSubmission', contestSubmissionSchema);
module.exports = ContestSubmission;