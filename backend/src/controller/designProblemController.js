const mongoose = require("mongoose");
const DesignProblem = require("../models/DesignProblem");

// ==========================================
// CREATE HLD PROBLEM
// ==========================================
const createDesignProblem = async (req, res) => {
  try {
    const {
      title,
      slug,
      difficulty,
      description,
      functionalRequirements,
      nonFunctionalRequirements,
      concepts,
      evaluation,
      isPublished,
    } = req.body;

    // -------------------------------
    // Validation
    // -------------------------------

    if (!title || !slug || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, slug and description are required",
      });
    }

    // -------------------------------
    // Check duplicate slug
    // -------------------------------

    const existingProblem = await DesignProblem.findOne({
      slug: slug.trim().toLowerCase(),
    });

    if (existingProblem) {
      return res.status(409).json({
        success: false,
        message: "A problem with this slug already exists",
      });
    }

    // -------------------------------
    // Create problem
    // -------------------------------

    const problem = await DesignProblem.create({
      title: title.trim(),

      slug: slug.trim().toLowerCase(),

      type: "HLD",

      difficulty: difficulty || "Easy",

      description: description.trim(),

      functionalRequirements:
        Array.isArray(functionalRequirements)
          ? functionalRequirements
          : [],

      nonFunctionalRequirements:
        Array.isArray(nonFunctionalRequirements)
          ? nonFunctionalRequirements
          : [],

      concepts:
        Array.isArray(concepts)
          ? concepts
          : [],

      evaluation: evaluation || {},

      isPublished:
        typeof isPublished === "boolean"
          ? isPublished
          : true,
    });

    return res.status(201).json({
      success: true,
      message: "HLD problem created successfully",
      problem,
    });
  } catch (error) {
    console.error(
      "Create HLD Problem Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create HLD problem",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL HLD PROBLEMS
// ==========================================
const getDesignProblems = async (req, res) => {
  try {
    const { difficulty } = req.query;

    const filter = {
      type: "HLD",
      isPublished: true,
    };

    // Optional difficulty filter
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const problems = await DesignProblem.find(filter)
      .select(
        "title slug type difficulty description concepts createdAt"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error(
      "Get HLD Problems Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch HLD problems",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE HLD PROBLEM
// Accepts either a Mongo _id or a slug in :id, so the
// same route can serve /designprolem/<objectId> and
// /designprolem/<slug> (e.g. "design-url-shortener").
// ==========================================
const getDesignProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const problem = await DesignProblem.findOne({
      ...(isObjectId
        ? { _id: id }
        : { slug: id.trim().toLowerCase() }),
      type: "HLD",
      isPublished: true,
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "HLD problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error(
      "Get HLD Problem Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch HLD problem",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE HLD PROBLEM
// ==========================================
const updateDesignProblem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem ID",
      });
    }

    const problem = await DesignProblem.findOne({
      _id: id,
      type: "HLD",
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "HLD problem not found",
      });
    }

    const allowedFields = [
      "title",
      "slug",
      "difficulty",
      "description",
      "functionalRequirements",
      "nonFunctionalRequirements",
      "concepts",
      "evaluation",
      "isPublished",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        problem[field] = req.body[field];
      }
    }

    // Normalize slug
    if (req.body.slug) {
      problem.slug = req.body.slug
        .trim()
        .toLowerCase();
    }

    await problem.save();

    return res.status(200).json({
      success: true,
      message: "HLD problem updated successfully",
      problem,
    });
  } catch (error) {
    console.error(
      "Update HLD Problem Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update HLD problem",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE HLD PROBLEM
// ==========================================
const deleteDesignProblem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem ID",
      });
    }

    const problem = await DesignProblem.findOne({
      _id: id,
      type: "HLD",
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "HLD problem not found",
      });
    }

    await DesignProblem.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "HLD problem deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete HLD Problem Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete HLD problem",
      error: error.message,
    });
  }
};

module.exports = {
  createDesignProblem,
  getDesignProblems,
  getDesignProblem,
  updateDesignProblem,
  deleteDesignProblem,
};