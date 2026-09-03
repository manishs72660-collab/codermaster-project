const express = require("express");

const {
  createDesignProblem,
  getDesignProblems,
  getDesignProblem,
  updateDesignProblem,
  deleteDesignProblem,
} = require("../controller/designProblemController");
const adminmiddleware=require("../middleware/adminmiddleware");
const router = express.Router();

router.post("/creat",adminmiddleware, createDesignProblem);

router.get("/", getDesignProblems);

router.get("/:id", getDesignProblem);

router.put("/:id",adminmiddleware, updateDesignProblem);

router.delete("/:id",adminmiddleware, deleteDesignProblem);

module.exports = router;