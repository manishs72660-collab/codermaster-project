const jwt=require("jsonwebtoken");
const User=require("../models/Userschema");
const client=require("../config/redis");
const userAuth = async (req,res,next)=>{
    try{
        const {token} = req.cookies;
        if(!token){
            throw new Error("Token Doesn't exist");
        }

        const payload =  jwt.verify(token,process.env.JWT_KEY);
        const {_id} = payload;
        if(!_id){
            throw new Error("Id is missing");
        }
        const result = await User.findById(_id);
        if(!result){
            throw new Error("User Doesn't exist");
        }
        req.result = result;
        const IsBlocked = await client.exists(`token:${token}`);
        if(IsBlocked)
            throw new Error("Invalid Token");

        next();
    }
    catch(err){
        res.send("Error: "+ err.message)
    }

}

module.exports=userAuth;