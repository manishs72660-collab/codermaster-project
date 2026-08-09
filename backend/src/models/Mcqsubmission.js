const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, min: 0, max: 3, default: null }, // null = left unanswered
    isCorrect: { type: Boolean, default: false },
}, { _id: false });

const mcqSubmissionSchema = new mongoose.Schema({
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'McqContest', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One submission per user per contest — this is the whole-sheet submit,
// unlike the coding contest's per-problem submissions, so it's enforced
// as a hard unique constraint at the DB level.
mcqSubmissionSchema.index({ contestId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('McqSubmission', mcqSubmissionSchema);