const Submission = require("../models/Submission");
const SolutionPost = require("../models/solutionpost");

// ==================== Post Solution ====================
const postSolution = async (req, res) => {
  try {
    const { submissionId, title, explanation } = req.body;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Submission id is required",
      });
    }

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.userId.toString() !== req.result._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (submission.status !== "accepted") {
      return res.status(403).json({
        success: false,
        message: "Only accepted submissions can be posted.",
      });
    }

    const alreadyPosted = await SolutionPost.findOne({
      submissionId,
    });

    if (alreadyPosted) {
      return res.status(400).json({
        success: false,
        message: "This submission has already been posted.",
      });
    }

    const post = await SolutionPost.create({
      submissionId,
      userId: submission.userId,
      problemId: submission.problemId,
      code: submission.code,
      language: submission.language,
      title,
      explanation,
    });

    return res.status(201).json({
      success: true,
      message: "Solution posted successfully.",
      post,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==================== Get All Posts of a Problem ====================
const getAllPosts = async (req, res) => {
  try {
    const { problemId } = req.params;

    const posts = await SolutionPost.find({ problemId })
      .populate("userId", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: posts.length,
      posts,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==================== Get Single Post ====================
const getSinglePost = async (req, res) => {
  try {
    const post = await SolutionPost.findByIdAndUpdate(
      req.params.postId,
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      }
    ).populate("userId", "firstName profileImage");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==================== Delete Post ====================
const deletePost = async (req, res) => {
  try {
    const post = await SolutionPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.userId.toString() !== req.result._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post.",
      });
    }

    await SolutionPost.findByIdAndDelete(req.params.postId);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports={postSolution,getAllPosts,getSinglePost,deletePost};