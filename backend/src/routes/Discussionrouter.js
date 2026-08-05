const express = require('express');
const discussionRouter = express.Router();

// NOTE: adjust this import to match your actual auth middleware/path.
// It should populate `req.result` (or similar) with the logged-in user,
// the same way it's done for your existing /code and /solution routes.
const userauth = require("../middleware/userauth");

const Discussion = require('../models/Discussion');
const DiscussionReply = require('../models/Discussionreply');
const Problem = require('../models/problemschema'); // adjust path/name if different

// UserSchema only has firstName/lastName/profileImage — there is no `name`
// field, so every populate() below selects the fields that actually exist.
const USER_POPULATE_FIELDS = 'firstName lastName profileImage role';

// ── POST /discuss/post ── create a new discussion message
// body: { problemId, message }
discussionRouter.post('/post', userauth, async (req, res) => {
  try {
    const { problemId, message } = req.body;
    const userId = req.result._id;

    if (!problemId || !message || !message.trim()) {
      return res.status(400).json({ message: 'problemId and message are required' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const discussion = await Discussion.create({
      problemId,
      userId,
      message: message.trim(),
    });

    const populated = await discussion.populate('userId', USER_POPULATE_FIELDS);

    res.status(201).json({ message: 'Posted', discussion: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post message', error: err.message });
  }
});

// ── POST /discuss/posts/:problemId ── fetch the discussion feed for a problem
// (POST instead of GET to match the rest of this app's convention)
discussionRouter.post('/posts/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;

    const discussions = await Discussion.find({ problemId })
      .sort({ createdAt: -1 })
      .populate('userId', USER_POPULATE_FIELDS)
      .lean();

    res.status(200).json({ discussions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch discussion', error: err.message });
  }
});

// ── POST /discuss/delete/:discussionId ── delete your own message (or admin)
discussionRouter.post('/delete/:discussionId', userauth, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const userId = req.result._id;
    const userRole = req.result.role;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const isOwner = discussion.userId.toString() === userId.toString();
    const isPrivileged = ['admin', 'collageadmin'].includes((userRole || '').toLowerCase());

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Discussion.findByIdAndDelete(discussionId);
    await DiscussionReply.deleteMany({ discussionId }); // clean up any replies too

    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete message', error: err.message });
  }
});

// ── POST /discuss/reply/:discussionId ── reply to a message
// body: { message }
discussionRouter.post('/reply/:discussionId', userauth, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { message } = req.body;
    const userId = req.result._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ message: 'Message is too long (max 1000 characters)' });
    }

    const parent = await Discussion.findById(discussionId);
    if (!parent) {
      return res.status(404).json({ message: 'Discussion message not found' });
    }

    const reply = await DiscussionReply.create({
      discussionId,
      userId,
      message: message.trim(),
    });

    const populated = await reply.populate('userId', USER_POPULATE_FIELDS);

    res.status(201).json({ message: 'Reply posted', reply: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post reply', error: err.message });
  }
});

// ── POST /discuss/replies/:discussionId ── fetch replies for one message
discussionRouter.post('/replies/:discussionId', async (req, res) => {
  try {
    const { discussionId } = req.params;

    const replies = await DiscussionReply.find({ discussionId })
      .sort({ createdAt: 1 })
      .populate('userId', USER_POPULATE_FIELDS)
      .lean();

    res.status(200).json({ replies });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch replies', error: err.message });
  }
});

// ── POST /discuss/reply/delete/:replyId ── delete your own reply (or admin)
discussionRouter.post('/reply/delete/:replyId', userauth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.result._id;
    const userRole = req.result.role;

    const reply = await DiscussionReply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const isOwner = reply.userId.toString() === userId.toString();
    const isPrivileged = ['admin', 'collageadmin'].includes((userRole || '').toLowerCase());

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    await DiscussionReply.findByIdAndDelete(replyId);

    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete reply', error: err.message });
  }
});

module.exports = discussionRouter;