const mongoose = require('mongoose');
const { Schema } = mongoose;

// A single "thought/doubt" message posted in a problem's Discussion tab.
// Open to any logged-in user — NOT for full solutions (that lives under /solution).
const discussionSchema = new Schema(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'problem', // ⚠️ verify this matches how your Problem model is registered
      // e.g. mongoose.model('problem', problemSchema) in models/problemschema.js.
      // If that file uses mongoose.model('Problem', ...) instead, change this to 'Problem'.
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // ✅ fixed — matches mongoose.model('User', UserSchema)
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 1000,
    },
  },
  { timestamps: true }
);
discussionSchema.index({ problemId: 1, createdAt: -1 });

const Discussion = mongoose.model('discussion', discussionSchema);

module.exports = Discussion;