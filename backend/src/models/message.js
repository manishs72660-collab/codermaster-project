const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRequest",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ chatRequestId: 1, createdAt: 1 });

module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);