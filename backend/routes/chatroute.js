const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");
const ChatRequest = require("../models/ChatRequest");
const Message = require("../models/Message");

// fetch full message history for a given chat
// GET /api/chats/:chatRequestId/messages
router.get("/chats/:chatRequestId/messages", userAuth, async (req, res) => {
  try {
    const { chatRequestId } = req.params;

    const chatRequest = await ChatRequest.findById(chatRequestId);
    if (!chatRequest) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // only the two participants of this chat may read it
    const requesterId = req.result._id.toString();
    if (
      requesterId !== chatRequest.userId.toString() &&
      requesterId !== chatRequest.adminId.toString()
    ) {
      return res.status(403).json({ error: "Not authorized to view this chat" });
    }

    const messages = await Message.find({ chatRequestId }).sort({ createdAt: 1 });

    res.json({ chatRequest, messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// list all of the logged-in user's chats (active + past)
// GET /api/chats/my
router.get("/chats/my", userAuth, async (req, res) => {
  try {
    const myId = req.result._id;
    const chats = await ChatRequest.find({
      $or: [{ userId: myId }, { adminId: myId }],
    })
      .sort({ updatedAt: -1 })
      .populate("userId", "firstName emailId")
      .populate("adminId", "firstName emailId");

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

module.exports = router;