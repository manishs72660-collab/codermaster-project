const express = require('express');

const submitroute =  express.Router();
const userAuth=require("../middleware/userauth");
const {submitCode,Solvedprovlembyuser,userstate,runCode,userrank,streak,solveduniqueproblem}=require("../controller/submit");
const submitCodeRateLimiter=require("../middleware/submitrate");


submitroute.post("/submit/:id",userAuth,submitCode);
submitroute.post("/runcode/:id",userAuth,runCode);
submitroute.get("/solveproblem/:id",userAuth,submitCodeRateLimiter,Solvedprovlembyuser);
submitroute.get("/userstate",userAuth,userstate);
submitroute.get("/userrank",userAuth,userrank);
submitroute.get("/userstrik",userAuth,streak);
submitroute.get("/solveduniqueproblem",userAuth,solveduniqueproblem);

module.exports = submitroute;
