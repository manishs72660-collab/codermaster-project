const mongoose = require('mongoose');
const { Schema } = mongoose;

// A reply to a discussion message — lets other users respond to a doubt/thought
// without opening a brand new top-level message.
const discussionReplySchema = new Schema(
  {
    discussionId: {
      type: Schema.Types.ObjectId,
      ref: 'discussion',
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
      // Bumped 500 -> 1000 to match the 1000-char limit already enforced in
      // Discussionrouter.js's /reply/:discussionId route and the frontend's
      // maxLength on the reply textarea. Previously a reply of 501-1000 chars
      // would pass the route's own check but then fail Mongoose validation.
      maxLength: 1000,
    },
  },
  { timestamps: true }
);

discussionReplySchema.index({ discussionId: 1, createdAt: 1 });

const DiscussionReply = mongoose.model('discussionReply', discussionReplySchema);

module.exports = DiscussionReply;