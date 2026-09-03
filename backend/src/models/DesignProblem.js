const mongoose = require("mongoose");

const designProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["HLD"],
      default: "HLD",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    functionalRequirements: {
      type: [String],
      default: [],
    },

    nonFunctionalRequirements: {
      type: [String],
      default: [],
    },

    concepts: {
      type: [String],
      default: [],
    },

    // Used by Gemini to understand
    // what should be checked
    evaluation: {
      requiredComponents: {
        type: [String],
        default: [],
      },

      recommendedComponents: {
        type: [String],
        default: [],
      },

      requiredConnections: {
        type: [String],
        default: [],
      },

      rules: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DesignProblem = mongoose.model(
  "DesignProblem",
  designProblemSchema
);

module.exports = DesignProblem;