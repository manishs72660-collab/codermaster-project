const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    doubt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Answer content is required'],
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

answerSchema.index({ doubt: 1, isAccepted: -1 });

module.exports = mongoose.models.Answer || mongoose.model("Answer", answerSchema);