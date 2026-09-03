
const express = require("express");
const compilerRouter = express.Router();
const { runCode } = require("../controller/Compilercontroller");

const userAuth = require("../middleware/userauth");

compilerRouter.post("/run", userAuth, runCode);

module.exports = compilerRouter;