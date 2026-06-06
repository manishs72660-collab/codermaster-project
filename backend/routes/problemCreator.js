const express = require('express');

const problemRouter =  express.Router();
const adminmiddleware=require("../middleware/adminmiddleware");
const userAuth=require("../middleware/userauth");
const {createProblem,buildFullCode}=require("../controller/userproblem");
const {updateproblem,deleteproblem,getProblemById,getAllProblem,problemsearch,getProblemforadmin}=require("../controller/update");

// Create
problemRouter.post("/create",adminmiddleware ,createProblem);
problemRouter.put("/updateproblem/:id",adminmiddleware,updateproblem);
problemRouter.delete("/deleteproblem/:id",adminmiddleware,deleteproblem);
problemRouter.get("/admin/:id",adminmiddleware,getProblemforadmin)


problemRouter.get("/:id",userAuth,getProblemById);
problemRouter.get("/",userAuth,getAllProblem);
problemRouter.get("/api/search",userAuth,problemsearch)
// problemRouter.get("/user", solvedAllProblembyUser);


module.exports = problemRouter;

// fetch
// update
// delete 
