const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "ended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ChatRequest || mongoose.model("ChatRequest", chatRequestSchema);