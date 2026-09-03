const mongoose = require("mongoose");

const designSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DesignProblem",
      required: true,
    },

    // Student's HLD architecture
    design: {
      nodes: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },

      edges: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },

    // Gemini evaluation
    aiEvaluation: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      summary: {
        type: String,
        default: "",
      },

      strengths: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },

      issues: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },

      suggestions: {
        type: [String],
        default: [],
      },

      finalVerdict: {
        type: String,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["pending", "evaluated", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const DesignSubmission = mongoose.model(
  "DesignSubmission",
  designSubmissionSchema
);

module.exports = DesignSubmission;