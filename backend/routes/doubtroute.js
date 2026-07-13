const express = require("express");
const {
    createDoubt,
    getDoubts,
    getDoubtById,
    updateDoubt,
    deleteDoubt,
} = require("../controller/doubtcontroller");
const { createAnswer } = require("../controller/answercontroller");
const userAuth = require("../middleware/userauth");

const doubtRouter = express.Router();

doubtRouter.post("/create", userAuth, createDoubt);
doubtRouter.get("/", getDoubts);
doubtRouter.get("/:id", getDoubtById);
doubtRouter.patch("/:id", userAuth, updateDoubt);
doubtRouter.delete("/:id", userAuth, deleteDoubt);
doubtRouter.post("/:id/answer", userAuth, createAnswer);

module.exports = doubtRouter;