const mongoose = require("mongoose");

const DesignProblem = require("../models/DesignProblem");
const DesignSubmission = require("../models/DesignSubmission");

const {
  reviewHLDWithGemini,
} = require("../utils/geminiDesignReviewer");

// ==========================================
// SUBMIT HLD DESIGN
// ==========================================
const submitHLD = async (req, res) => {
  try {
    const { problemId } = req.params;

    const { nodes, edges } = req.body;

    // --------------------------------------
    // USER
    // --------------------------------------

    if (!req.result || !req.result._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.result._id;

    // --------------------------------------
    // VALIDATE PROBLEM ID
    // --------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(problemId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem ID",
      });
    }

    // --------------------------------------
    // VALIDATE NODES
    // --------------------------------------

    if (!Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        message: "nodes must be an array",
      });
    }

    // --------------------------------------
    // VALIDATE EDGES
    // --------------------------------------

    if (!Array.isArray(edges)) {
      return res.status(400).json({
        success: false,
        message: "edges must be an array",
      });
    }

    // --------------------------------------
    // LIMIT DESIGN SIZE
    // --------------------------------------
    // Prevent huge payloads being sent to Gemini

    if (nodes.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 100 nodes are allowed",
      });
    }

    if (edges.length > 200) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 200 connections are allowed",
      });
    }

    // --------------------------------------
    // FIND HLD PROBLEM
    // --------------------------------------

    const problem = await DesignProblem.findOne({
      _id: problemId,
      type: "HLD",
      isPublished: true,
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "HLD problem not found",
      });
    }

    // --------------------------------------
    // CREATE SUBMISSION
    // --------------------------------------

    const submission =
      await DesignSubmission.create({
        userId,
        problemId,

        design: {
          nodes,
          edges,
        },

        status: "pending",
      });

    // --------------------------------------
    // SEND DESIGN TO GEMINI
    // --------------------------------------

    let aiEvaluation;

    try {
      aiEvaluation =
        await reviewHLDWithGemini({
          problem,
          design: {
            nodes,
            edges,
          },
        });
    } catch (aiError) {
      console.error(
        "Gemini HLD Evaluation Error:",
        aiError
      );

      submission.status = "failed";

      await submission.save();

      return res.status(502).json({
        success: false,
        message:
          "Design submitted, but AI evaluation failed",
        submissionId: submission._id,
      });
    }

    // --------------------------------------
    // VALIDATE AI RESPONSE
    // --------------------------------------

    if (
      !aiEvaluation ||
      typeof aiEvaluation.score !== "number"
    ) {
      submission.status = "failed";

      await submission.save();

      return res.status(502).json({
        success: false,
        message:
          "AI returned an invalid evaluation",
        submissionId: submission._id,
      });
    }

    // --------------------------------------
    // SAVE AI EVALUATION
    // --------------------------------------

    submission.aiEvaluation = {
      score: Math.max(
        0,
        Math.min(100, aiEvaluation.score)
      ),

      summary:
        aiEvaluation.summary || "",

      strengths:
        Array.isArray(aiEvaluation.strengths)
          ? aiEvaluation.strengths
          : [],

      issues:
        Array.isArray(aiEvaluation.issues)
          ? aiEvaluation.issues
          : [],

      suggestions:
        Array.isArray(aiEvaluation.suggestions)
          ? aiEvaluation.suggestions
          : [],

      finalVerdict:
        aiEvaluation.finalVerdict || "",
    };

    submission.status = "evaluated";

    await submission.save();

    // --------------------------------------
    // RESPONSE
    // --------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "HLD submitted and evaluated successfully",

      submissionId: submission._id,

      evaluation: submission.aiEvaluation,
    });
  } catch (error) {
    console.error(
      "Submit HLD Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit HLD",
      error: error.message,
    });
  }
};

// ==========================================
// GET SUBMISSION RESULT
// ==========================================
const getHLDSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        submissionId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const submission =
      await DesignSubmission.findById(
        submissionId
      )
        .populate(
          "problemId",
          "title slug difficulty description"
        )
        .populate(
          "userId",
          "name email"
        );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // User should only see their own submission
    if (
      req.result &&
      submission.userId._id.toString() !==
        req.result._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error(
      "Get HLD Submission Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch submission",
      error: error.message,
    });
  }
};

module.exports = {
  submitHLD,
  getHLDSubmission,
};