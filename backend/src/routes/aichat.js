const express = require("express");
const userAuth=require("../middleware/userauth");
const adminmiddleware=require("../middleware/adminmiddleware");
const airoute = express.Router();
const solveDoubt=require("../controller/aichat");

airoute.post("/solve",userAuth,solveDoubt);
module.exports=airoute;