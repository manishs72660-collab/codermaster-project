const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 150,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxLength: 5000,
    },
    // optional code snippet attached to a post (e.g. "showing off a solution")
    code: {
      language: { type: String, default: null },
      content: { type: String, default: null },
    },
    tags: {
      type: [String],
      enum: ["general", "help", "contest-discussion", "duel-brag", "showcase"],
      default: ["general"],
    },
    // link a post to a contest/problem for contextual threads (optional)
    relatedContest: {
      type: Schema.Types.ObjectId,
      ref: "contest",
      default: null,
    },
    relatedProblem: {
      type: Schema.Types.ObjectId,
      ref: "problem",
      default: null,
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [commentSchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// helpful for feed sorting/filtering
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ title: "text", body: "text" });

const Post = mongoose.model("post", postSchema);

module.exports = Post;