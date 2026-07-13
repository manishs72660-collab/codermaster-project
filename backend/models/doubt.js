const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // optional link to an existing problem in your judge/problem set
    relatedProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    views: {
      type: Number,
      default: 0,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      default: null,
    },
  },
  { timestamps: true }
);

// helpful indexes for listing/filtering
doubtSchema.index({ tags: 1 });
doubtSchema.index({ status: 1, createdAt: -1 });
doubtSchema.index({ title: 'text', description: 'text' });


module.exports = mongoose.models.Doubt || mongoose.model("Doubt", doubtSchema);