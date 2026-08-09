const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const client = require("../config/redis");
const User = require("../models/Userschema");
const ChatRequest = require("../models/chatrequest");
const Message = require("../models/message");
const userAuth = require("../middleware/userauth");

router.get("/admins", userAuth, async (req, res) => {
  try {
    const requester = req.result;

    let filter;

    if (requester.role === "Admin") {
      // Platform admins only see other platform admins
      filter = {
        role: "Admin",
        _id: { $ne: requester._id },
      };
    } else if (requester.collegeId) {
      // Users/CollegeAdmins with a college: see their college's CollegeAdmins
      // PLUS all platform Admins (global, regardless of college)
      filter = {
        _id: { $ne: requester._id },
        $or: [
          { role: "CollageAdmin", collegeId: requester.collegeId },
          { role: "Admin" },
        ],
      };
    } else {
      // No college attached: only platform Admins
      filter = {
        role: "Admin",
        _id: { $ne: requester._id },
      };
    }

    const admins = await User.find(filter)
      .select("-password")
      .populate("collegeId", "Collage_name collegeCode");

    const onlineAdminIds = await client.sMembers("online_admins");

    const result = admins.map((admin) => ({
      ...admin.toObject(),
      isOnline: onlineAdminIds.includes(admin._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/admins error:", err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// ================= list every chat request belonging to me =================
// Used by "My Chats" page — shows chats where I'm either the user who
// requested it or the admin who accepted it, most recently updated first.
router.get("/mine", userAuth, async (req, res) => {
  try {
    const requester = req.result;

    const chats = await ChatRequest.find({
      $or: [{ userId: requester._id }, { adminId: requester._id }],
    })
      .populate("userId", "firstName emailId")
      .populate("adminId", "firstName emailId")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error("GET /chat/mine error:", err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// ================= load a chat room + its message history =================
router.get("/chats/:chatRequestId/messages", userAuth, async (req, res) => {
  try {
    const { chatRequestId } = req.params;
    const requester = req.result;

    if (!mongoose.Types.ObjectId.isValid(chatRequestId)) {
      return res.status(400).json({ error: "Invalid chat id" });
    }

    const chatRequest = await ChatRequest.findById(chatRequestId)
      .populate("userId", "firstName emailId")
      .populate("adminId", "firstName emailId");

    if (!chatRequest) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const requesterId = requester._id.toString();
    const chatUserId = (chatRequest.userId?._id || chatRequest.userId).toString();
    const chatAdminId = (chatRequest.adminId?._id || chatRequest.adminId).toString();

    const isParticipant = requesterId === chatUserId || requesterId === chatAdminId;

    if (!isParticipant) {
      return res.status(403).json({ error: "You don't have access to this chat" });
    }

    if (!["accepted", "ended"].includes(chatRequest.status)) {
      return res.status(403).json({ error: "This chat is not active" });
    }

    const messages = await Message.find({ chatRequestId }).sort({ createdAt: 1 });

    res.json({ chatRequest, messages });
  } catch (err) {
    console.error("GET /chat/chats/:chatRequestId/messages error:", err);
    res.status(500).json({ error: "Failed to load chat" });
  }
});

module.exports = router;