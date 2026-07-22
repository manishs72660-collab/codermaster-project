const Post = require("../models/Communityschema");

/* ── CREATE POST ───────────────────────────────── */
const createPost = async (req, res) => {
  try {
    const { title, body, tags, code, relatedContest, relatedProblem } = req.body;
    const userId = req.result._id; // set by auth middleware

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const post = await Post.create({
      author: userId,
      title,
      body,
      tags: Array.isArray(tags) && tags.length ? tags : ["general"],
      code: code?.content ? code : undefined,
      relatedContest: relatedContest || null,
      relatedProblem: relatedProblem || null,
    });

    const populated = await post.populate("author", "firstName lastName emailId");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Error creating post: " + err.message });
  }
};

/* ── GET FEED (paginated, filter by tag, sort by hot/new) ── */
const getAllPosts = async (req, res) => {
  try {
    const { tag, sort = "new", page = 1, limit = 10, search } = req.query;
    const userId = req.result?._id;

    const filter = {};
    if (tag && tag !== "all") filter.tags = tag;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    let posts = await Post.find(filter)
      .populate("author", "firstName lastName emailId")
      .select("-comments.body") // don't ship full comment bodies in feed, only counts needed
      .lean();

    // "hot" = upvote count weighted lightly by recency; "new" = createdAt desc
    if (sort === "hot") {
      posts.sort((a, b) => {
        const scoreA = a.upvotes.length - hoursSince(a.createdAt) * 0.05;
        const scoreB = b.upvotes.length - hoursSince(b.createdAt) * 0.05;
        return scoreB - scoreA;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = posts.length;
    posts = posts.slice(skip, skip + Number(limit));

    const shaped = posts.map((p) => ({
      ...p,
      upvoteCount: p.upvotes.length,
      commentCount: p.comments.length,
      isUpvoted: userId ? p.upvotes.some((id) => id.toString() === userId.toString()) : false,
      comments: undefined,
      upvotes: undefined,
    }));

    res.status(200).json({ posts: shaped, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts: " + err.message });
  }
};

const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / 3600000;

/* ── GET SINGLE POST (with full comments) ─────────── */
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.result?._id;

    const post = await Post.findById(id)
      .populate("author", "firstName lastName emailId")
      .populate("comments.author", "firstName lastName emailId")
      .lean();

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json({
      ...post,
      upvoteCount: post.upvotes.length,
      isUpvoted: userId ? post.upvotes.some((uid) => uid.toString() === userId.toString()) : false,
      comments: post.comments.map((c) => ({
        ...c,
        upvoteCount: c.upvotes.length,
        isUpvoted: userId ? c.upvotes.some((uid) => uid.toString() === userId.toString()) : false,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching post: " + err.message });
  }
};

/* ── DELETE POST (author only) ─────────────────────── */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.result._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting post: " + err.message });
  }
};

/* ── UPVOTE / UN-UPVOTE POST (toggle) ───────────────── */
const toggleUpvotePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.result._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyUpvoted = post.upvotes.some((uid) => uid.toString() === userId.toString());

    if (alreadyUpvoted) {
      post.upvotes = post.upvotes.filter((uid) => uid.toString() !== userId.toString());
    } else {
      post.upvotes.push(userId);
    }

    await post.save();
    res.status(200).json({ upvoteCount: post.upvotes.length, isUpvoted: !alreadyUpvoted });
  } catch (err) {
    res.status(500).json({ message: "Error updating upvote: " + err.message });
  }
};

/* ── ADD COMMENT ─────────────────────────────────── */
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.result._id;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Comment body is required" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ author: userId, body: body.trim() });
    await post.save();

    const populated = await post.populate("comments.author", "firstName lastName emailId");
    const newComment = populated.comments[populated.comments.length - 1];

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment: " + err.message });
  }
};

/* ── DELETE COMMENT (author only) ───────────────────── */
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.result._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment: " + err.message });
  }
};

/* ── UPVOTE / UN-UPVOTE COMMENT (toggle) ────────────── */
const toggleUpvoteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.result._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const alreadyUpvoted = comment.upvotes.some((uid) => uid.toString() === userId.toString());

    if (alreadyUpvoted) {
      comment.upvotes = comment.upvotes.filter((uid) => uid.toString() !== userId.toString());
    } else {
      comment.upvotes.push(userId);
    }

    await post.save();
    res.status(200).json({ upvoteCount: comment.upvotes.length, isUpvoted: !alreadyUpvoted });
  } catch (err) {
    res.status(500).json({ message: "Error updating comment upvote: " + err.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  toggleUpvotePost,
  addComment,
  deleteComment,
  toggleUpvoteComment,
};