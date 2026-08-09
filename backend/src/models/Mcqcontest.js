const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
}, { _id: false });

const mcqQuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true, trim: true },
    options: {
        type: [optionSchema],
        validate: {
            validator: (arr) => arr.length === 4,
            message: 'Each question must have exactly 4 options',
        },
        required: true,
    },
    // Index (0-3) into `options` — never sent to participants before they submit.
    correctOption: {
        type: Number,
        required: true,
        min: 0,
        max: 3,
    },
    marks: { type: Number, default: 1, min: 1 },
    explanation: { type: String, trim: true, default: '' },
});

const mcqContestSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    // Optional per-attempt timer (e.g. 30 min), separate from the overall
    // contest window (startTime/endTime). Enforce this on the frontend
    // client-side timer + double-check server-side if you add a
    // "startedAt" field to McqSubmission later.
    durationMinutes: { type: Number, default: null },
    questions: {
        type: [mcqQuestionSchema],
        validate: {
            validator: (arr) => arr.length > 0 && arr.length <= 20,
            message: 'A contest must have between 1 and 20 questions',
        },
        default: [],
    },
    isPublic: { type: Boolean, default: true },
    joinCode: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Fixed: 'Collage' -> 'College' to match mongoose.model('College', ...)
    // in models/College.js and the ref used in User.js. This was the
    // remaining source of the "Schema hasn't been registered" error.
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

mcqContestSchema.index({ joinCode: 1 });

module.exports = mongoose.model('McqContest', mcqContestSchema);