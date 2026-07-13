const express = require("express");
const {
    toggleUpvote,
    acceptAnswer,
    deleteAnswer,
} = require("../controller/answercontroller");
const userAuth = require("../middleware/userauth");

const answerRouter = express.Router();

answerRouter.patch("/:id/upvote", userAuth, toggleUpvote);
answerRouter.patch("/:id/accept", userAuth, acceptAnswer);
answerRouter.delete("/:id", userAuth, deleteAnswer);

module.exports = answerRouter;